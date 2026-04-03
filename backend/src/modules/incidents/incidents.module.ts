import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { AgentsModule } from '../agents/agents.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    forwardRef(() => AgentsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
