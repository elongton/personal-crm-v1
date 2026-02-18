import type { QueueJob } from "@crm/contracts";

export class InMemoryQueue {
  private readonly jobs: QueueJob[] = [];

  enqueue(job: QueueJob): void {
    this.jobs.push(job);
  }

  dequeue(): QueueJob | undefined {
    return this.jobs.shift();
  }

  size(): number {
    return this.jobs.length;
  }
}
