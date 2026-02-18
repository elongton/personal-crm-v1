import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "api",
    dbEnabled: process.env.DB_MODE === "postgres" && Boolean(process.env.DATABASE_URL),
    time: new Date().toISOString(),
  }));
}
