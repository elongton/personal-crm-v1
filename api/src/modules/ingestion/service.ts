import crypto from "crypto";
import { incrementSyncError, observeSyncLag, recordSyncRunStatus } from "../../lib/observability";
import { createGoogleConnector } from "../google/connectors";
import {
  createSyncRun,
  getCheckpoint,
  getCoverage,
  insertInteraction,
  listSyncRuns,
  setCheckpoint,
  upsertContact,
  upsertSourceItem,
  updateSyncRunStatus,
} from "./repositories";

const connector = createGoogleConnector();

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function monthChunks(startIso: string, endIso: string): Array<{ startIso: string; endIso: string }> {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const chunks: Array<{ startIso: string; endIso: string }> = [];

  let cursor = new Date(start);
  while (cursor < end) {
    const next = new Date(cursor);
    next.setUTCMonth(next.getUTCMonth() + 1);
    if (next > end) next.setTime(end.getTime());

    chunks.push({
      startIso: cursor.toISOString(),
      endIso: next.toISOString(),
    });
    cursor = next;
  }

  return chunks;
}

async function processWindow(
  tenantId: string,
  kind: "backfill" | "daily",
  startIso: string,
  endIso: string,
): Promise<void> {
  const [gmailItems, calendarItems] = await Promise.all([
    connector.fetchGmail({ tenantId, startIso, endIso }),
    connector.fetchCalendar({ tenantId, startIso, endIso }),
  ]);

  for (const item of gmailItems) {
    const upsert = await upsertSourceItem({
      tenantId,
      source: "gmail",
      externalId: item.id,
      externalUpdatedAt: item.updatedAt,
      payload: item,
      payloadHash: hashPayload(item),
    });
    if (!upsert.changed) continue;
    const contactId = await upsertContact(tenantId, item.fromEmail, item.fromName);
    await insertInteraction(tenantId, contactId, "email", item.occurredAt, item.subject, item.snippet);
    observeSyncLag(kind, Date.now() - new Date(item.occurredAt).getTime());
  }

  for (const item of calendarItems) {
    const upsert = await upsertSourceItem({
      tenantId,
      source: "calendar",
      externalId: item.id,
      externalUpdatedAt: item.updatedAt,
      payload: item,
      payloadHash: hashPayload(item),
    });
    if (!upsert.changed) continue;
    const contactId = await upsertContact(tenantId, item.organizerEmail, item.organizerName);
    await insertInteraction(tenantId, contactId, "meeting", item.occurredAt, item.summary, "");
    observeSyncLag(kind, Date.now() - new Date(item.occurredAt).getTime());
  }
}

export async function runSync(params: {
  tenantId: string;
  kind: "backfill" | "daily";
  startIso: string;
  endIso: string;
}): Promise<{ runId: string }> {
  const run = await createSyncRun(params.tenantId, params.kind);
  recordSyncRunStatus(params.kind, "queued");
  await updateSyncRunStatus(run.id, "running");
  recordSyncRunStatus(params.kind, "running");

  try {
    if (params.kind === "backfill") {
      const chunks = monthChunks(params.startIso, params.endIso);
      const checkpoint = await getCheckpoint(params.tenantId, "backfill");
      const startIndex = checkpoint
        ? chunks.findIndex((chunk) => new Date(chunk.endIso).getTime() > new Date(checkpoint).getTime())
        : 0;
      const index = startIndex < 0 ? chunks.length : startIndex;

      for (let i = index; i < chunks.length; i++) {
        const chunk = chunks[i];
        await processWindow(params.tenantId, params.kind, chunk.startIso, chunk.endIso);

        const failAfterChunks = Number(process.env.SYNC_FAIL_AFTER_CHUNKS ?? "0");
        if (failAfterChunks > 0 && i + 1 >= failAfterChunks) {
          process.env.SYNC_FAIL_AFTER_CHUNKS = "0";
          throw new Error(`Simulated sync failure after ${failAfterChunks} chunk(s)`);
        }

        await setCheckpoint(params.tenantId, "backfill", chunk.endIso);
      }
    } else {
      await processWindow(params.tenantId, params.kind, params.startIso, params.endIso);
      await setCheckpoint(params.tenantId, "daily", params.endIso);
    }

    await updateSyncRunStatus(run.id, "completed");
    recordSyncRunStatus(params.kind, "completed");
    return { runId: run.id };
  } catch (error) {
    await updateSyncRunStatus(run.id, "failed", error instanceof Error ? error.message : "unknown");
    recordSyncRunStatus(params.kind, "failed");
    incrementSyncError(params.kind);
    throw error;
  }
}

export async function listStatus(tenantId: string) {
  return listSyncRuns(tenantId);
}

export async function coverage(tenantId: string) {
  return getCoverage(tenantId);
}
