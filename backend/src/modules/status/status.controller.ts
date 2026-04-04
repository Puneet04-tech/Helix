import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { StatusService } from './status.service';
import { IncidentsService } from '../incidents/incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('status')
export class StatusController {
  constructor(
    private statusService: StatusService,
    private incidentsService: IncidentsService,
  ) {}

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
    // Return empty array if no specific project
    return [];
  }
}
