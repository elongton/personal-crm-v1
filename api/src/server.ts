import Fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { dbHealthRoutes } from "./routes/dbHealth";
import { authRoutes } from "./routes/auth";
import { ingestionRoutes } from "./routes/ingestion";
import { startDailyScheduler } from "./modules/ingestion/scheduler";
import { registerObservability } from "./lib/observability";

const app = Fastify({ logger: true });

async function main() {
  await registerObservability(app);
  await app.register(healthRoutes);
  await app.register(dbHealthRoutes);
  await app.register(authRoutes);
  await app.register(ingestionRoutes);

  const port = Number(process.env.PORT ?? 3000);
  const host = "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`API listening on ${host}:${port}`);
  startDailyScheduler();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
