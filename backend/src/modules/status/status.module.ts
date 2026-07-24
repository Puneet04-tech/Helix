import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusService } from './status.service';
import { PublicStatusService } from './public-status.service';
import { StatusController } from './status.controller';
import { IncidentsModule } from '../incidents/incidents.module';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { UptimeCalculatorService } from '../../common/services/uptime-calculator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    IncidentsModule,
  ],
  providers: [StatusService, PublicStatusService, UptimeCalculatorService],
  controllers: [StatusController],
  exports: [StatusService, PublicStatusService],
})
export class StatusModule {}
