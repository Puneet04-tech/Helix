import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplianceService } from './compliance.service';
import { ComplianceReportService } from './compliance-report.service';
import { ComplianceController } from './compliance.controller';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  providers: [ComplianceService, ComplianceReportService],
  controllers: [ComplianceController],
  exports: [ComplianceService, ComplianceReportService],
})
export class ComplianceModule {}
