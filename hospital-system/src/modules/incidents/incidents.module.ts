import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { HelixService } from '../../services/helix.service';

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, HelixService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
