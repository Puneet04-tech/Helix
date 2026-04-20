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

    // Track incident in Helix SDK
    const severity = incident.severity as 'low' | 'medium' | 'high';
    this.helixService.trackCrisisPrediction(
      `${incident.type}: ${incident.title} (${incident.unit})`,
      severity
    );

    return incident;
  }

  async findAll() {
    return this.incidents.sort((a, b) => b.timestamp - a.timestamp);
  }
}
