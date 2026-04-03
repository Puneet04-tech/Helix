import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusService } from './status.service';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
