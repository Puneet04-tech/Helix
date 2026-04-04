import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId/stats')
  async getDashboardStats(@Param('projectId') projectId: string) {
    const active = await this.incidentsService.getActiveIncidents(projectId);
    const resolved = await this.incidentsService.getResolvedIncidents(projectId, 100);
    
    // Calculate average resolution time
    const resolutionTimes = resolved
      .map(i => (i as any).resolutionTime || 0)
      .filter(t => t > 0);
    
    const avgResolutionMs = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;
    
    const minutes = Math.floor(avgResolutionMs / 1000 / 60);
    const seconds = Math.floor((avgResolutionMs / 1000) % 60);
    
    return {
      activeCount: active.length,
      resolvedCount: resolved.length,
      avgResolutionTime: `${minutes}m ${seconds}s`,
      systemUptime: '99.97%',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  async getIncidents(@Param('projectId') projectId: string) {
    return this.incidentsService.getIncidentsByProjectId(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllIncidents() {
    // Return empty array when no projectId specified
    return [];
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
