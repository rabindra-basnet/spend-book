import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_PRIORITY, QUEUE_NAMES } from './queue.constants.js';

/**
 * Shared BullMQ configuration: every worker/producer resolves Redis from
 * `config.redis.url` (REDIS_URL) so producers and consumers agree on the
 * same connection settings.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow('redis.host'),
          port: config.getOrThrow('redis.port'),
          username: config.get('redis.username') ?? undefined,
          password: config.get('redis.password') ?? undefined,
          tls: config.get('redis.tls') ?? undefined,
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),
    ...QUEUE_NAMES.map((name) =>
      BullModule.registerQueue({
        name,
        defaultJobOptions: {
          priority: QUEUE_PRIORITY[name],
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600 },
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}