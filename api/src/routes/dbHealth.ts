import { FastifyInstance } from "fastify";
import { getPrisma } from "../lib/prisma";

export async function dbHealthRoutes(app: FastifyInstance) {
  app.get("/db/health", async () => {
    if (process.env.DB_MODE !== "postgres" || !process.env.DATABASE_URL) {
      return { ok: true, dbEnabled: false, note: "DB_MODE not postgres or DATABASE_URL not set" };
    }

    const prisma = getPrisma();
    // simple query to validate connectivity
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, dbEnabled: true };
  });
}
