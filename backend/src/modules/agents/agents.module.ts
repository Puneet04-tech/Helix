import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { CorrelationService } from './correlation.service';
import { FingerprintingService } from './fingerprinting.service';
import { ChaosService } from './chaos.service';
import { ImpactService } from './impact.service';
import { KnowledgeService } from './knowledge.service';
import { CanaryService } from './canary.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { PlaywrightService } from '../../common/services/playwright.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService, 
    CorrelationService, 
    PlaywrightService,
    FingerprintingService,
    ChaosService,
    ImpactService,
    KnowledgeService,
    CanaryService
  ],
  exports: [
    AgentsService, 
    CorrelationService,
    FingerprintingService,
    ChaosService,
    ImpactService,
    KnowledgeService,
    CanaryService
  ],
})
export class AgentsModule {}
