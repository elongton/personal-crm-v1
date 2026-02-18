import test from "node:test";
import assert from "node:assert/strict";
import { getSyncMetricsSnapshot } from "../src/lib/observability";
import { coverage, listStatus, runSync } from "../src/modules/ingestion/service";

process.env.GOOGLE_AUTH_MODE = "mock";
delete process.env.DATABASE_URL;
delete process.env.DB_MODE;

test("backfill sync writes source, contacts, interactions and is idempotent", async () => {
  const tenantId = "tenant-ingestion-idempotent";
  const start = "2025-01-01T00:00:00.000Z";
  const end = "2025-02-01T00:00:00.000Z";

  await runSync({ tenantId, kind: "backfill", startIso: start, endIso: end });
  const first = await coverage(tenantId);
  assert.equal(first.sourceItems, 2);
  assert.equal(first.contacts, 2);
  assert.equal(first.interactions, 2);

  await runSync({ tenantId, kind: "backfill", startIso: start, endIso: end });
  const second = await coverage(tenantId);
  assert.equal(second.sourceItems, 2);
  assert.equal(second.contacts, 2);
  assert.equal(second.interactions, 2);
});

test("backfill resumes from checkpoint after simulated mid-run failure", async () => {
  const tenantId = "tenant-ingestion-resume";
  const start = "2025-01-01T00:00:00.000Z";
  const end = "2025-04-01T00:00:00.000Z";

  process.env.SYNC_FAIL_AFTER_CHUNKS = "1";
  await assert.rejects(() => runSync({ tenantId, kind: "backfill", startIso: start, endIso: end }), /Simulated sync failure/);

  const afterFailure = await coverage(tenantId);
  assert.equal(afterFailure.sourceItems, 2, "first month should be committed before failure");

  await runSync({ tenantId, kind: "backfill", startIso: start, endIso: end });
  const afterResume = await coverage(tenantId);
  assert.equal(afterResume.sourceItems, 6, "three monthly windows x two source types");
  assert.equal(afterResume.contacts, 2, "contacts remain deduplicated");
  assert.equal(afterResume.interactions, 6);

  const statuses = await listStatus(tenantId);
  assert.equal(statuses[0]?.status, "completed");
  assert.equal(statuses[1]?.status, "failed");

  const metrics = getSyncMetricsSnapshot();
  assert.ok(metrics.errorCounters.backfill >= 1, "failed run increments error counter");
  assert.ok(metrics.runStatusCounters["backfill:completed"] >= 1);
  assert.ok(metrics.runStatusCounters["backfill:failed"] >= 1);
  assert.ok(metrics.lagMsGauge.backfill >= 0);
});
