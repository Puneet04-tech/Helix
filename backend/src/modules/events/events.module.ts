import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Audit, AuditSchema } from '../../common/schemas/audit.schema';
import { MemoryService } from '../../common/services/memory.service';
import { HuggingFaceService } from '../../common/services/huggingface.service';
import { OllamaService } from '../../common/services/ollama.service';
import { GroqService } from '../../common/services/groq.service';
import { AuditService } from '../../common/services/audit.service';
import { IngestRateLimitService } from '../../common/services/ingest-rate-limit.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { IncidentsModule } from '../incidents/incidents.module';
import { AuditController } from '../../common/controllers/audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Audit.name, schema: AuditSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
    forwardRef(() => IncidentsModule),
  ],
  controllers: [EventsController, AuditController],
  providers: [
    EventsService,
    MemoryService,
    OllamaService,
    GroqService,
    HuggingFaceService,
    AuditService,
    IngestRateLimitService,
    EventsGateway,
  ],
  exports: [
    EventsService,
    MemoryService,
    OllamaService,
    GroqService,
    HuggingFaceService,
    AuditService,
    EventsGateway,
  ],
})
export class EventsModule {}
