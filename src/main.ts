import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: [
      'https://starkpill.me',
      'https://www.starkpill.me',
      'https://starkpill.clinic',
      'https://www.starkpill.clinic',
      'https://starkpill.vercel.app',
    ],
  });
  await app.listen(app.get(ConfigService).get('PORT'));
}
bootstrap();
