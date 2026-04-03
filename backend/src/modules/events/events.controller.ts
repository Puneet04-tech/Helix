import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Public endpoint for SDK - requires API key
  @Post('ingest')
  async ingestEvent(
    @Headers('x-api-key') apiKey: string,
    @Body() eventData: any,
  ) {
    return this.eventsService.ingestEvent(apiKey, eventData);
  }

  // Protected endpoints for dashboard
  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  async getProjectEvents(
    @Query('limit') limit: string = '50',
  ) {
    return this.eventsService.getEventsByProjectId('', parseInt(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/type/:type')
  async getEventsByType(
    @Query('limit') limit: string = '20',
  ) {
    return this.eventsService.getEventsByType('', '', parseInt(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get('memory-stats')
  async getMemoryStats() {
    return this.eventsService.getMemoryStats();
  }
}
