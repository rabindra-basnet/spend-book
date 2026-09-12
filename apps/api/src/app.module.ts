import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration.js';
import { validate } from './config/validation.schema.js';
import { FeaturesModule } from './modules/features.module.js';
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
    FeaturesModule,
  ],
})
export class AppModule {}