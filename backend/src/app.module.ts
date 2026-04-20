import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { config } from 'dotenv';

config();

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AgentsModule } from './modules/agents/agents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { StatusModule } from './modules/status/status.module';
import { PostmortemModule } from './modules/postmortem/postmortem.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

// Controllers
import { AppController } from './app.controller';
import { AuditController } from './common/controllers/audit.controller';

// Services
import { AppService } from './app.service';
import { MemoryService } from './common/services/memory.service';
import { HuggingFaceService } from './common/services/huggingface.service';
import { OllamaService } from './common/services/ollama.service';
import { GroqService } from './common/services/groq.service';
import { PlaywrightService } from './common/services/playwright.service';
import { AuditService } from './common/services/audit.service';

// Schemas
import { Audit, AuditSchema } from './common/schemas/audit.schema';

// Gateways
import { EventsGateway } from './common/gateways/events.gateway';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/helix',
      {
        retryAttempts: 5,
        retryDelay: 5000,
      },
    ),
    MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }]),
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    
    // Feature modules
    AuthModule,
    ClientsModule,
    EventsModule,
    IncidentsModule,
    AgentsModule,
    NotificationsModule,
    ChatbotModule,
    StatusModule,
    PostmortemModule,
    ComplianceModule,
  ],
  controllers: [AppController, AuditController],
  providers: [AppService, MemoryService, OllamaService, GroqService, HuggingFaceService, PlaywrightService, AuditService, EventsGateway],
})
export class AppModule {}
