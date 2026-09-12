/**
 * BullMQ queue names and default job priorities.
 *
 * Mirrors Sure's Sidekiq queue priorities (docs/migration-inventory.md):
 * scheduled(10) > high_priority(4) > medium_priority(2) > low_priority(1) > default(1).
 */
export const QUEUE_NAME = {
  scheduled: 'scheduled',
  highPriority: 'high-priority',
  mediumPriority: 'medium-priority',
  lowPriority: 'low-priority',
  default: 'default',
} as const;

export type QueueName = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME];

/** Higher number = higher priority inside BullMQ. */
export const QUEUE_PRIORITY: Record<QueueName, number> = {
  [QUEUE_NAME.scheduled]: 10,
  [QUEUE_NAME.highPriority]: 4,
  [QUEUE_NAME.mediumPriority]: 2,
  [QUEUE_NAME.lowPriority]: 1,
  [QUEUE_NAME.default]: 1,
};

export const QUEUE_NAMES: QueueName[] = Object.values(QUEUE_NAME);

/** Ping job name used for connectivity smoke tests. */
export const PING_JOB = 'ping';

export interface PingJobData {
  at: string;
  note?: string;
}