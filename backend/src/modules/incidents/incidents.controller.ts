import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  async getIncidents(@Param('projectId') projectId: string) {
    return this.incidentsService.getIncidentsByProjectId(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/active')
  async getActiveIncidents(@Param('projectId') projectId: string) {
    return this.incidentsService.getActiveIncidents(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/resolved')
  async getResolvedIncidents(@Param('projectId') projectId: string) {
    return this.incidentsService.getResolvedIncidents(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':incidentId')
  async getIncident(@Param('incidentId') incidentId: string) {
    return this.incidentsService.getIncidentDetail(incidentId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':incidentId/status')
  async updateStatus(
    @Param('incidentId') incidentId: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.incidentsService.updateIncidentStatus(incidentId, body.status, {
      notes: body.notes,
    });
  }
}
