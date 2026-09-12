import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { configuration } from './config/configuration.js';
import { validate } from './config/validation.schema.js';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './database/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}