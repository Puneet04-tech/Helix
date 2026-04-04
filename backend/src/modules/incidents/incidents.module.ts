import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { PredictiveCrisisService } from './predictive-crisis.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { AgentsModule } from '../agents/agents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostmortemModule } from '../postmortem/postmortem.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Event.name, schema: EventSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    forwardRef(() => AgentsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => PostmortemModule),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, PredictiveCrisisService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
