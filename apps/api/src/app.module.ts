import { createRequire } from 'node:module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        const isProd = process.env.NODE_ENV === 'production';
        const isSelfHosted = config.get<boolean>('auth.selfHosted') ?? false;

        let transport: any;
        if (isTest) {
          transport = undefined;
        } else if (isSelfHosted || process.env.LOG_FILE_PATH || !isProd) {
          const destination = process.env.LOG_FILE_PATH || `${process.cwd()}/logs/app.log`;
          transport = {
            target: 'pino/file',
            options: { destination, mkdir: true },
          };
        }

        return {
          pinoHttp: {
            level: isTest ? 'silent' : 'info',
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie'],
              censor: '[REDACTED]',
            },
            transport,
          },
        };
      },
    }),
  ],
})
export class AppModule {}
