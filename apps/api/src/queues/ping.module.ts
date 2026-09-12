import { Module } from '@nestjs/common';
import { PingQueueService } from './ping-queue.service.js';
import { PingProcessor } from './ping.processor.js';

@Module({
  providers: [PingQueueService, PingProcessor],
  exports: [PingQueueService],
})
export class PingModule {}
