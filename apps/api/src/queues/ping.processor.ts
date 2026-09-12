import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PING_JOB, PingJobData, QUEUE_NAME } from './queue.constants.js';
import { queueLogger } from './queue-logger.util.js';

@Processor(QUEUE_NAME.default)
export class PingProcessor extends WorkerHost {
  private readonly logger = new Logger(PingProcessor.name);

  async process(job: Job<PingJobData>): Promise<string> {
    if (job.name !== PING_JOB) return 'unhandled';
    const msg = `Ping received at ${job.data.at} (job ${job.id}, note: ${job.data.note})`;
    this.logger.log(msg);
    queueLogger.info({ jobId: job.id, jobName: job.name, queue: QUEUE_NAME.default }, msg);
    return job.name;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PingJobData>): void {
    const msg = `Ping job ${job.id} completed`;
    this.logger.log(msg);
    queueLogger.info({ jobId: job.id, jobName: job.name, queue: QUEUE_NAME.default }, msg);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PingJobData>, err: Error): void {
    const msg = `Ping job ${job.id} failed: ${err.message}`;
    this.logger.error(msg, err.stack);
    queueLogger.error({ jobId: job.id, jobName: job.name, queue: QUEUE_NAME.default, err: err.message, stack: err.stack }, msg);
  }
}
