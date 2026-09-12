import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PING_JOB, PingJobData, QUEUE_NAME } from './queue.constants.js';

@Processor(QUEUE_NAME.default)
export class PingProcessor extends WorkerHost {
  private readonly logger = new Logger(PingProcessor.name);

  async process(job: Job<PingJobData>): Promise<string> {
    if (job.name !== PING_JOB) return 'unhandled';
    this.logger.log(
      `Ping received at ${job.data.at} (job ${job.id}, note: ${job.data.note})`,
    );
    return job.name;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PingJobData>): void {
    this.logger.log(`Ping job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PingJobData>, err: Error): void {
    this.logger.error(`Ping job ${job.id} failed: ${err.message}`, err.stack);
  }
}
