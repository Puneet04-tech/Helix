import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { HelixService } from '../../services/helix.service';
import { HelixWebhookController } from '../webhooks/helix-webhook.controller';

@Module({
  controllers: [IncidentsController, HelixWebhookController],
  providers: [IncidentsService, HelixService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
