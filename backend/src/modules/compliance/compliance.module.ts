import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplianceService } from './compliance.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
