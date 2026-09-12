import { createRequire } from 'node:module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { configuration } from './config/configuration.js';
import { validate } from './config/validation.schema.js';
import { FeaturesModule } from './modules/features.module.js';
import { PrismaModule } from './database/prisma.module.js';

const require = createRequire(import.meta.url);

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
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: require.resolve('pino-pretty'),
                options: { singleLine: true, colorize: true },
              },
      },
    }),
  ],
})
export class AppModule {}