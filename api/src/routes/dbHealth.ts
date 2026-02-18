import { FastifyInstance } from "fastify";
import { getPrisma } from "../lib/prisma";

export async function dbHealthRoutes(app: FastifyInstance) {
  app.get("/db/health", async () => {
    if (!process.env.DATABASE_URL) {
      return { ok: true, dbEnabled: false, note: "DATABASE_URL not set" };
    }

    const prisma = getPrisma();
    // simple query to validate connectivity
    await prisma.example.findFirst();
    return { ok: true, dbEnabled: true };
  });
}
