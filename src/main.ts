import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });
  app.use(cookieParser());
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
