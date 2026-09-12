import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('port');
  await app.listen(port, '0.0.0.0');
  console.log(`Listening on http://0.0.0.0:${port}`);
}
await bootstrap();