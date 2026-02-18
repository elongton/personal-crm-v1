import Fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { dbHealthRoutes } from "./routes/dbHealth";

const app = Fastify({ logger: true });

async function main() {
  await app.register(healthRoutes);
  await app.register(dbHealthRoutes);

  const port = Number(process.env.PORT ?? 3000);
  const host = "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`API listening on ${host}:${port}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
