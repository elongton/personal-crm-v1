import test from "node:test";
import assert from "node:assert/strict";
import { runSync, coverage } from "../src/modules/ingestion/service";

process.env.GOOGLE_AUTH_MODE = "mock";
delete process.env.DATABASE_URL;

test("backfill sync writes source, contacts, interactions and is idempotent", async () => {
  const tenantId = "tenant-ingestion";
  const start = new Date(Date.now() - 2 * 86400000).toISOString();
  const end = new Date().toISOString();

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
