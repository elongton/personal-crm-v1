import { FastifyInstance } from "fastify";
import { coverage, listStatus, runSync } from "../modules/ingestion/service";

const DEFAULT_TENANT = "00000000-0000-0000-0000-000000000001";

function defaultWindow() {
  const end = new Date();
  const start = new Date(Date.now() - 365 * 24 * 3600 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function ingestionRoutes(app: FastifyInstance) {
  app.post<{ Body: { tenantId?: string; mode?: "backfill" | "daily"; startIso?: string; endIso?: string } }>(
    "/ingestion/start",
    async (req, reply) => {
      const tenantId = req.body?.tenantId ?? DEFAULT_TENANT;
      const kind = req.body?.mode ?? "backfill";
      const w = defaultWindow();
      const run = await runSync({
        tenantId,
        kind,
        startIso: req.body?.startIso ?? w.startIso,
        endIso: req.body?.endIso ?? w.endIso,
      });
      return reply.code(202).send({ ok: true, runId: run.runId, tenantId, kind });
    },
  );

  app.get<{ Querystring: { tenantId?: string } }>("/ingestion/status", async (req) => {
    const tenantId = req.query.tenantId ?? DEFAULT_TENANT;
    return { ok: true, runs: await listStatus(tenantId) };
  });

  app.get<{ Querystring: { tenantId?: string } }>("/coverage", async (req) => {
    const tenantId = req.query.tenantId ?? DEFAULT_TENANT;
    return { ok: true, coverage: await coverage(tenantId) };
  });

  app.post<{ Body: { tenantId?: string } }>("/ingestion/refresh", async (req, reply) => {
    const tenantId = req.body?.tenantId ?? DEFAULT_TENANT;
    const end = new Date();
    const start = new Date(Date.now() - 24 * 3600 * 1000);
    const run = await runSync({ tenantId, kind: "daily", startIso: start.toISOString(), endIso: end.toISOString() });
    return reply.code(202).send({ ok: true, runId: run.runId, tenantId, kind: "daily" });
  });
}
