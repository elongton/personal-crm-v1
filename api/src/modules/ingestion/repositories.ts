import crypto from "crypto";
import { getPrisma } from "../../lib/prisma";

export type SyncStatus = "queued" | "running" | "completed" | "failed";

export interface SyncRun {
  id: string;
  tenantId: string;
  kind: "backfill" | "daily";
  status: SyncStatus;
  startedAt: string;
  finishedAt?: string;
  errorSummary?: string;
}

export interface SourceItemInput {
  tenantId: string;
  source: "gmail" | "calendar";
  externalId: string;
  externalUpdatedAt: string;
  payload: unknown;
  payloadHash: string;
}

const syncRunsMem: SyncRun[] = [];
const sourceItemMem = new Map<string, SourceItemInput>();
const contactsMem = new Map<string, { id: string; tenantId: string; email: string; name: string }>();
const interactionsMem: Array<{ id: string; tenantId: string; contactId: string; type: "email" | "meeting" }> = [];
const checkpointsMem = new Map<string, string>();

const hasDb = () => process.env.DB_MODE === "postgres" && Boolean(process.env.DATABASE_URL);

function checkpointKey(tenantId: string, kind: "backfill" | "daily"): string {
  return `${tenantId}:${kind}`;
}

export async function createSyncRun(tenantId: string, kind: "backfill" | "daily"): Promise<SyncRun> {
  const id = crypto.randomUUID();
  const run: SyncRun = { id, tenantId, kind, status: "queued", startedAt: new Date().toISOString() };

  if (!hasDb()) {
    syncRunsMem.unshift(run);
    return run;
  }

  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `INSERT INTO sync_runs (id, tenant_id, kind, status, started_at) VALUES ($1,$2,$3,$4, now())`,
    id,
    tenantId,
    kind,
    "queued",
  );
  return run;
}

export async function updateSyncRunStatus(id: string, status: SyncStatus, errorSummary?: string): Promise<void> {
  if (!hasDb()) {
    const run = syncRunsMem.find((x) => x.id === id);
    if (!run) return;
    run.status = status;
    if (status === "completed" || status === "failed") run.finishedAt = new Date().toISOString();
    if (errorSummary) run.errorSummary = errorSummary;
    return;
  }

  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `UPDATE sync_runs SET status=$2, finished_at = CASE WHEN $2 IN ('completed','failed') THEN now() ELSE finished_at END, error_summary=$3 WHERE id=$1`,
    id,
    status,
    errorSummary ?? null,
  );
}

export async function listSyncRuns(tenantId: string): Promise<SyncRun[]> {
  if (!hasDb()) return syncRunsMem.filter((x) => x.tenantId === tenantId);
  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; tenant_id: string; kind: "backfill" | "daily"; status: SyncStatus; started_at: Date; finished_at: Date | null; error_summary: string | null }>>(
    `SELECT id, tenant_id, kind, status, started_at, finished_at, error_summary FROM sync_runs WHERE tenant_id=$1 ORDER BY started_at DESC LIMIT 25`,
    tenantId,
  );
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    kind: r.kind,
    status: r.status,
    startedAt: r.started_at.toISOString(),
    finishedAt: r.finished_at?.toISOString(),
    errorSummary: r.error_summary ?? undefined,
  }));
}

export async function upsertSourceItem(item: SourceItemInput): Promise<{ changed: boolean }> {
  const memKey = `${item.tenantId}:${item.source}:${item.externalId}`;
  if (!hasDb()) {
    const existing = sourceItemMem.get(memKey);
    if (existing && existing.payloadHash === item.payloadHash) return { changed: false };
    sourceItemMem.set(memKey, item);
    return { changed: true };
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<Array<{ payload_hash: string }>>(
    `SELECT payload_hash FROM source_items WHERE tenant_id=$1 AND source=$2 AND external_id=$3 LIMIT 1`,
    item.tenantId,
    item.source,
    item.externalId,
  );
  const previous = rows[0];
  if (previous && previous.payload_hash === item.payloadHash) return { changed: false };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO source_items (tenant_id, source, external_id, external_updated_at, payload_jsonb, payload_hash, ingested_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6, now())
    ON CONFLICT (tenant_id, source, external_id)
    DO UPDATE SET external_updated_at=EXCLUDED.external_updated_at, payload_jsonb=EXCLUDED.payload_jsonb, payload_hash=EXCLUDED.payload_hash, ingested_at=now();
    `,
    item.tenantId,
    item.source,
    item.externalId,
    item.externalUpdatedAt,
    JSON.stringify(item.payload),
    item.payloadHash,
  );
  return { changed: true };
}

export async function upsertContact(tenantId: string, email: string, name: string): Promise<string> {
  if (!hasDb()) {
    const key = `${tenantId}:${email.toLowerCase()}`;
    const existing = contactsMem.get(key);
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    contactsMem.set(key, { id, tenantId, email, name });
    return id;
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM contacts WHERE tenant_id=$1 AND lower(primary_email)=lower($2) LIMIT 1`,
    tenantId,
    email,
  );
  if (rows[0]) return rows[0].id;
  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, tenant_id, canonical_name, primary_email, created_at, updated_at) VALUES ($1,$2,$3,$4, now(), now())`,
    id,
    tenantId,
    name,
    email,
  );
  return id;
}

export async function insertInteraction(
  tenantId: string,
  contactId: string,
  type: "email" | "meeting",
  occurredAt: string,
  subject: string,
  snippet: string,
): Promise<void> {
  if (!hasDb()) {
    interactionsMem.push({ id: crypto.randomUUID(), tenantId, contactId, type });
    return;
  }
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `INSERT INTO interactions (id, tenant_id, contact_id, type, occurred_at, subject, snippet) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    crypto.randomUUID(),
    tenantId,
    contactId,
    type,
    occurredAt,
    subject,
    snippet,
  );
}

export async function getCoverage(tenantId: string): Promise<{ contacts: number; interactions: number; sourceItems: number }> {
  if (!hasDb()) {
    return {
      contacts: [...contactsMem.values()].filter((c) => c.tenantId === tenantId).length,
      interactions: interactionsMem.filter((i) => i.tenantId === tenantId).length,
      sourceItems: [...sourceItemMem.values()].filter((i) => i.tenantId === tenantId).length,
    };
  }
  const prisma = getPrisma();
  const [c, i, s] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*)::bigint AS count FROM contacts WHERE tenant_id=$1`, tenantId),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*)::bigint AS count FROM interactions WHERE tenant_id=$1`, tenantId),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*)::bigint AS count FROM source_items WHERE tenant_id=$1`, tenantId),
  ]);
  return { contacts: Number(c[0]?.count ?? 0), interactions: Number(i[0]?.count ?? 0), sourceItems: Number(s[0]?.count ?? 0) };
}

export async function getCheckpoint(tenantId: string, kind: "backfill" | "daily"): Promise<string | null> {
  if (!hasDb()) return checkpointsMem.get(checkpointKey(tenantId, kind)) ?? null;

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<Array<{ last_completed_window_end: Date }>>(
    `SELECT last_completed_window_end FROM sync_checkpoints WHERE tenant_id=$1 AND kind=$2 LIMIT 1`,
    tenantId,
    kind,
  );
  const row = rows[0];
  return row?.last_completed_window_end?.toISOString() ?? null;
}

export async function setCheckpoint(tenantId: string, kind: "backfill" | "daily", lastCompletedWindowEndIso: string): Promise<void> {
  if (!hasDb()) {
    checkpointsMem.set(checkpointKey(tenantId, kind), lastCompletedWindowEndIso);
    return;
  }

  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO sync_checkpoints (tenant_id, kind, last_completed_window_end, updated_at)
      VALUES ($1,$2,$3, now())
      ON CONFLICT (tenant_id, kind)
      DO UPDATE SET last_completed_window_end=EXCLUDED.last_completed_window_end, updated_at=now();
    `,
    tenantId,
    kind,
    lastCompletedWindowEndIso,
  );
}
