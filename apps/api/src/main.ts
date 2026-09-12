import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      forbidNonWhitelisted: false,
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new LoggerErrorInterceptor(),
  );
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('port');

  const swagger = new DocumentBuilder()
    .setTitle(config.getOrThrow<string>('app.productName'))
    .setDescription('Spend Book API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(
    `API listening on http://0.0.0.0:${port} (docs at /docs)`,
  );
}
void bootstrap();