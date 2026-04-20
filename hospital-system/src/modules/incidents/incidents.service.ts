import { Injectable } from '@nestjs/common';
import { HelixService } from '../../services/helix.service';

@Injectable()
export class IncidentsService {
  private incidents: any[] = [];

  constructor(private helixService: HelixService) {}

  async create(createIncidentDto: any) {
    const incident = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...createIncidentDto,
    };

    this.incidents.push(incident);

    // Send directly to central Helix backend
    try {
      const severity = incident.severity as 'low' | 'medium' | 'high' | 'critical';
      await this.helixService.sendIncidentToCentralHelix({
        incidentId: incident.id,
        projectId: 'hospital_001',
        type: incident.type,
        title: incident.title,
        severity,
        description: incident.description,
        unit: incident.unit,
        timestamp: incident.timestamp,
        service: 'hospital-system',
      });
    } catch (error) {
      console.error('Failed to send incident to Helix:', error);
    }

    return incident;
  }

  async findAll() {
    return this.incidents.sort((a, b) => b.timestamp - a.timestamp);
  }
}
