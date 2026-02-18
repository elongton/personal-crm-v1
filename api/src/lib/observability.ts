import { FastifyInstance } from "fastify";

type RunKind = "backfill" | "daily";
type RunStatus = "queued" | "running" | "completed" | "failed";

const syncRunStatusCounters: Record<`${RunKind}:${RunStatus}`, number> = {
  "backfill:queued": 0,
  "backfill:running": 0,
  "backfill:completed": 0,
  "backfill:failed": 0,
  "daily:queued": 0,
  "daily:running": 0,
  "daily:completed": 0,
  "daily:failed": 0,
};

const syncErrorCounters: Record<RunKind, number> = {
  backfill: 0,
  daily: 0,
};

const syncLagMsGauge: Record<RunKind, number> = {
  backfill: 0,
  daily: 0,
};

export function recordSyncRunStatus(kind: RunKind, status: RunStatus): void {
  syncRunStatusCounters[`${kind}:${status}`] += 1;
}

export function incrementSyncError(kind: RunKind): void {
  syncErrorCounters[kind] += 1;
}

export function observeSyncLag(kind: RunKind, lagMs: number): void {
  syncLagMsGauge[kind] = Math.max(0, lagMs);
}

export function getSyncMetricsSnapshot() {
  return {
    runStatusCounters: { ...syncRunStatusCounters },
    errorCounters: { ...syncErrorCounters },
    lagMsGauge: { ...syncLagMsGauge },
  };
}

export async function registerObservability(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (req) => {
    (req as { startTime?: number }).startTime = Date.now();
  });

  app.addHook("onResponse", async (req, reply) => {
    const startTime = (req as { startTime?: number }).startTime ?? Date.now();
    const durationMs = Date.now() - startTime;
    req.log.info({
      metric: "http_request",
      method: req.method,
      path: req.url,
      statusCode: reply.statusCode,
      durationMs,
    });
  });

  app.get("/metrics", async () => ({ ok: true, sync: getSyncMetricsSnapshot() }));
}
