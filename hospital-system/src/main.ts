// hospital-system/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5001;
  await app.listen(port);

  console.log(`🏥 Hospital System Backend running on port ${port}`);
  console.log(`🔗 Project ID: ${process.env.HELIX_PROJECT_ID}`);
}

bootstrap();
