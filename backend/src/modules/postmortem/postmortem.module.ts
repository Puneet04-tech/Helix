import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostmortemService } from './postmortem.service';
import { PostmortemPDFService } from './postmortem-pdf.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]),
    AgentsModule,
  ],
  providers: [PostmortemService, PostmortemPDFService],
  exports: [PostmortemService, PostmortemPDFService],
})
export class PostmortemModule {}
