import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS - allow all origins in production for stability, or specific ones
  app.enableCors({
    origin: true, // This will reflect the request origin, allowing any domain to access
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  const port = process.env.PORT || 5000;
  console.log(`Setting up listener on port ${port}...`);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Helix Backend running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
