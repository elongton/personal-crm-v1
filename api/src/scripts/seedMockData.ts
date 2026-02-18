import { runSync } from "../modules/ingestion/service";

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
  const end = new Date();
  const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const run = await runSync({
    tenantId,
    kind: "backfill",
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
  console.log(JSON.stringify({ ok: true, seeded: true, runId: run.runId, tenantId }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
