import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { Queue } from 'bullmq';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configuration } from '../config/configuration.js';
import { QueuesModule } from './queues.module.js';
import { PingModule } from './ping.module.js';
import { PING_JOB, PingJobData, QUEUE_NAME } from './queue.constants.js';

class PingProbe {
  constructor(
    @InjectQueue(QUEUE_NAME.default) private readonly q: Queue<PingJobData>,
  ) {}

  getQueue(): Queue<PingJobData> {
    return this.q;
  }
}

describe('BullMQ Redis connectivity', () => {
  let app: INestApplication;
  let queue: Queue<PingJobData>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          load: [configuration],
          envFilePath: ['.env'],
        }),
        QueuesModule,
        PingModule,
      ],
      providers: [PingProbe],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    queue = app.get(PingProbe).getQueue();
    await queue.obliterate({ force: true });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('enqueues a ping job and the default-queue processor completes it', async () => {
    const job = await queue.add(PING_JOB, {
      at: new Date().toISOString(),
      note: 'vitest-connectivity',
    });

    const deadline = Date.now() + 30_000;
    let finished = false;
    while (Date.now() < deadline) {
      const current = await queue.getJob(job.id ?? '');
      expect(current).not.toBeNull();
      const state = await current?.getState();
      if (state === 'completed') {
        finished = true;
        break;
      }
      if (state === 'failed') {
        throw new Error(`ping job failed: ${current?.failedReason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    expect(finished).toBe(true);
  });
});
