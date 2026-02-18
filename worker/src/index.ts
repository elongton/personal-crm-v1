import type { QueueJob } from "@crm/contracts";
import { InMemoryQueue } from "./queue";

function newNoopJob(): QueueJob {
  return {
    id: `noop-${Date.now()}`,
    type: "noop",
    enqueuedAt: new Date().toISOString(),
  };
}

async function run(): Promise<void> {
  const queue = new InMemoryQueue();
  queue.enqueue(newNoopJob());

  const job = queue.dequeue();
  if (!job) {
    throw new Error("No queued job found");
  }

  console.log(`[worker] processed job id=${job.id} type=${job.type}`);
}

run().catch((error: unknown) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
