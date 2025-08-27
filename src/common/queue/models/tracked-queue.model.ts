import { Queue, QueueEvents } from 'bullmq';

export interface TrackedQueue {
  queue: Queue;
  events: QueueEvents;
}
