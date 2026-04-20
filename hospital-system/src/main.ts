// hospital-system/src/main.ts
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Helix from 'hotel-management-api-helix';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  // Initialize Helix SDK on startup
  const helixApiKey = process.env.HELIX_API_KEY || 'pk_hospital_001_default';
  const helixUrl = process.env.HELIX_API_URL || 'https://helix-backend.render.com';
  const projectId = process.env.HELIX_PROJECT_ID || 'hospital_001';

  const helix = new Helix({
    apiKey: helixApiKey,
    backendUrl: helixUrl,
    enabled: true,
    sampleRate: 1.0,
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Helix SDK Initialized (hotel-management-api-helix v1.0.0)');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`📍 Project ID: ${projectId}`);
  console.log(`🔐 API Key: ${helixApiKey.substring(0, 15)}...`);
  console.log(`🌐 Helix Backend: ${helixUrl}`);
  console.log(`✓ Status:`, helix.getStatus());
  console.log('═══════════════════════════════════════════════════════════\n');

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const corsOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
  ];
  if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL);
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5001;
  await app.listen(port);

  console.log('\n🏥 Hospital System Backend running on port', port);
  console.log(`📍 Project ID: ${projectId}`);
  console.log('✓ Helix SDK: Ready for crisis detection and monitoring');
  console.log(`✓ Multi-Tenancy: Enabled (Isolated from other tenants)\n`);
}

bootstrap();
