import { Controller, Get, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { StatusService } from './status.service';
import { PublicStatusService } from './public-status.service';
import { IncidentsService } from '../incidents/incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('status')
export class StatusController {
  constructor(
    private statusService: StatusService,
    private publicStatusService: PublicStatusService,
    private incidentsService: IncidentsService,
  ) {}

  /**
   * Feature 5: Public Status Page
   * GET /status/public/:clientId
   * NO authentication required - suitable for embedding or public display
   */
  @Get('public/:clientId')
  async getPublicStatus(@Param('clientId') clientId: string) {
    try {
      const statusData = await this.publicStatusService.getPublicStatusPage(clientId);
      
      if (statusData.error) {
        throw new HttpException(statusData.error, HttpStatus.NOT_FOUND);
      }

      return statusData;
    } catch (error) {
      // Preserve the intentional 404 instead of masking it as a 500.
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('project/:projectId')
  async getProjectStatus(@Param('projectId') projectId: string) {
    // Get all incidents for this project to extract services
    const incidents = await this.incidentsService.getIncidentsByProjectId(projectId);
    
    // Extract unique services and their statuses
    const serviceMap: Record<string, { count: number; status: string }> = {};
    
    incidents.forEach((incident: any) => {
      if (!serviceMap[incident.service]) {
        serviceMap[incident.service] = { count: 0, status: 'operational' };
      }
      serviceMap[incident.service].count++;
      
      // If service has critical incidents, mark as degraded
      if (incident.severity === 'critical' && incident.status !== 'resolved') {
        serviceMap[incident.service].status = 'degraded';
      }
    });

    // Convert to array format
    const services = Object.entries(serviceMap).map(([name, data]) => ({
      name,
      status: data.status,
      uptime: data.status === 'operational' ? 99.97 : 95.5,
    }));

    return services.length > 0 ? services : [];
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllStatus() {
    // Get all incidents to extract services
    const incidents = await this.incidentsService.getAllIncidents();
    
    // Extract unique services and their statuses
    const serviceMap: Record<string, { count: number; status: string }> = {};
    
    incidents.forEach((incident: any) => {
      if (!serviceMap[incident.service]) {
        serviceMap[incident.service] = { count: 0, status: 'operational' };
      }
      serviceMap[incident.service].count++;
      
      // If service has critical incidents, mark as degraded
      if (incident.severity === 'critical' && incident.status !== 'resolved') {
        serviceMap[incident.service].status = 'degraded';
      }
    });

    // Convert to array format
    const services = Object.entries(serviceMap).map(([name, data]) => ({
      name,
      status: data.status,
      uptime: data.status === 'operational' ? 99.97 : 95.5,
    }));

    return services.length > 0 ? services : [];
  }
}
