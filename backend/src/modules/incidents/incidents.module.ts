import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { PredictiveCrisisService } from './predictive-crisis.service';
import { CorrelationService } from './correlation.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Audit, AuditSchema } from '../../common/schemas/audit.schema';
import { User, UserSchema } from '../../common/schemas/user.schema';
import { AgentsModule } from '../agents/agents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostmortemModule } from '../postmortem/postmortem.module';
import { EventsModule } from '../events/events.module';
import { AuditService } from '../../common/services/audit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Event.name, schema: EventSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Audit.name, schema: AuditSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AgentsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => PostmortemModule),
    forwardRef(() => EventsModule),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, PredictiveCrisisService, CorrelationService, AuditService],
  exports: [IncidentsService, CorrelationService],
})
export class IncidentsModule {}
