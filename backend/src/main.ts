import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Generate JWT_SECRET if not set (for deployment convenience)
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      const crypto = require('crypto');
      process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
      logger.warn('JWT_SECRET not set, generated random secret for production');
    } else {
      process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
      logger.warn('JWT_SECRET not set, using development default');
    }
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://helix-threat.netlify.app',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Cache-Control,Pragma,x-api-key',
  });

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Helix Backend running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
