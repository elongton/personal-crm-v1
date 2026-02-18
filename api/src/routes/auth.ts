import { FastifyInstance } from "fastify";
import { buildGoogleAuthUrl, handleGoogleCallback } from "../modules/google/oauth";

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { tenantId?: string; returnTo?: string } }>("/auth/google/start", async (req, reply) => {
    const tenantId = req.body?.tenantId ?? "00000000-0000-0000-0000-000000000001";
    const authUrl = buildGoogleAuthUrl(tenantId, req.body?.returnTo);
    return reply.send({ ok: true, authUrl, mode: process.env.GOOGLE_AUTH_MODE ?? "mock" });
  });

  app.get<{ Querystring: { code?: string; state?: string } }>("/auth/google/callback", async (req, reply) => {
    const { code, state } = req.query;
    if (!code || !state) return reply.code(400).send({ ok: false, error: "Missing code/state" });

    const result = await handleGoogleCallback(code, state);
    return reply.send({ ok: true, tenantId: result.tenantId, subject: result.subject });
  });
}
