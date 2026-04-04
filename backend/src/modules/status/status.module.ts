import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { IncidentsModule } from '../incidents/incidents.module';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
    IncidentsModule,
  ],
  providers: [StatusService],
  controllers: [StatusController],
  exports: [StatusService],
})
export class StatusModule {}
