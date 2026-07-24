import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post('ingest')
  async ingestEvent(
    @Headers('x-api-key') apiKey: string,
    @Body() eventData: any,
  ) {
    return this.eventsService.ingestEvent(apiKey, eventData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  async getProjectEvents(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('limit') limit: string = '50',
  ) {
    const allowed = req.user?.projectIds || [];
    if (allowed.length > 0 && !allowed.includes(projectId)) {
      throw new UnauthorizedException('Access denied for this project');
    }
    return this.eventsService.getEventsByProjectId(projectId, parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/type/:type')
  async getEventsByType(
    @Param('projectId') projectId: string,
    @Param('type') type: string,
    @Req() req: any,
    @Query('limit') limit: string = '20',
  ) {
    const allowed = req.user?.projectIds || [];
    if (allowed.length > 0 && !allowed.includes(projectId)) {
      throw new UnauthorizedException('Access denied for this project');
    }
    return this.eventsService.getEventsByType(projectId, type, parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Get('memory-stats')
  async getMemoryStats() {
    return this.eventsService.getMemoryStats();
  }
}
