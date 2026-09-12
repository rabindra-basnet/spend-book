import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PING_JOB, PingJobData, QUEUE_NAME } from './queue.constants.js';

export interface PingResult {
  jobId?: string;
  echoedAt?: string;
}

@Injectable()
export class PingQueueService {
  constructor(
    @InjectQueue(QUEUE_NAME.default) private readonly queue: Queue<PingJobData>,
  ) {}

  async enqueue(note = 'connectivity-smoke-test'): Promise<PingResult> {
    const job = await this.queue.add(PING_JOB, {
      at: new Date().toISOString(),
      note,
    });
    return { jobId: job.id };
  }
}
