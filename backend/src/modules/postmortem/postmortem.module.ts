import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostmortemService } from './postmortem.service';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]),
  ],
  providers: [PostmortemService],
  exports: [PostmortemService],
})
export class PostmortemModule {}
