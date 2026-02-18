import { FastifyInstance } from "fastify";

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
}
