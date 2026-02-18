import crypto from "crypto";
import { createGoogleConnector } from "../google/connectors";
import {
  createSyncRun,
  getCoverage,
  insertInteraction,
  listSyncRuns,
  upsertContact,
  upsertSourceItem,
  updateSyncRunStatus,
} from "./repositories";

const connector = createGoogleConnector();

function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function runSync(params: {
  tenantId: string;
  kind: "backfill" | "daily";
  startIso: string;
  endIso: string;
}): Promise<{ runId: string }> {
  const run = await createSyncRun(params.tenantId, params.kind);
  await updateSyncRunStatus(run.id, "running");

  try {
    const [gmailItems, calendarItems] = await Promise.all([
      connector.fetchGmail({ tenantId: params.tenantId, startIso: params.startIso, endIso: params.endIso }),
      connector.fetchCalendar({ tenantId: params.tenantId, startIso: params.startIso, endIso: params.endIso }),
    ]);

    for (const item of gmailItems) {
      const upsert = await upsertSourceItem({
        tenantId: params.tenantId,
        source: "gmail",
        externalId: item.id,
        externalUpdatedAt: item.updatedAt,
        payload: item,
        payloadHash: hashPayload(item),
      });
      if (!upsert.changed) continue;
      const contactId = await upsertContact(params.tenantId, item.fromEmail, item.fromName);
      await insertInteraction(params.tenantId, contactId, "email", item.occurredAt, item.subject, item.snippet);
    }

    for (const item of calendarItems) {
      const upsert = await upsertSourceItem({
        tenantId: params.tenantId,
        source: "calendar",
        externalId: item.id,
        externalUpdatedAt: item.updatedAt,
        payload: item,
        payloadHash: hashPayload(item),
      });
      if (!upsert.changed) continue;
      const contactId = await upsertContact(params.tenantId, item.organizerEmail, item.organizerName);
      await insertInteraction(params.tenantId, contactId, "meeting", item.occurredAt, item.summary, "");
    }

    await updateSyncRunStatus(run.id, "completed");
    return { runId: run.id };
  } catch (error) {
    await updateSyncRunStatus(run.id, "failed", error instanceof Error ? error.message : "unknown");
    throw error;
  }
}

export async function listStatus(tenantId: string) {
  return listSyncRuns(tenantId);
}

export async function coverage(tenantId: string) {
  return getCoverage(tenantId);
}
