export type QueueJobType = "noop";

export interface QueueJob {
  id: string;
  type: QueueJobType;
  enqueuedAt: string;
}
