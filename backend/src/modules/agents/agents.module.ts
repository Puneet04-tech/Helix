import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { CorrelationService } from './correlation.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { PlaywrightService } from '../../common/services/playwright.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [AgentsService, CorrelationService, PlaywrightService],
  exports: [AgentsService, CorrelationService],
})
export class AgentsModule {}
