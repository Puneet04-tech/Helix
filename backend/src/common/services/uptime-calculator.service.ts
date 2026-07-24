import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../schemas/event.schema';
import { Incident, IncidentDocument } from '../schemas/incident.schema';

@Injectable()
export class UptimeCalculatorService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async calculateProjectUptime(projectId: string, windowDays = 30): Promise<number> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [totalEvents, errorEvents, activeIncidents] = await Promise.all([
      this.eventModel.countDocuments({ projectId, timestamp: { $gte: since } }),
      this.eventModel.countDocuments({
        projectId,
        timestamp: { $gte: since },
        type: { $in: ['error', 'critical', 'warning'] },
      }),
      this.incidentModel.countDocuments({
        projectId,
        detectedAt: { $gte: since },
        severity: 'critical',
      }),
    ]);

    if (totalEvents === 0 && activeIncidents === 0) {
      return 99.99;
    }

    const eventErrorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
    const incidentPenalty = Math.min(activeIncidents * 0.25, 5);
    const uptime = 100 - eventErrorRate * 100 - incidentPenalty;

    return Math.max(Math.min(Number(uptime.toFixed(2)), 100), 90);
  }

  async calculateServiceUptime(
    projectId: string,
    serviceName: string,
    windowDays = 30,
  ): Promise<number> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [totalEvents, errorEvents, serviceIncidents] = await Promise.all([
      this.eventModel.countDocuments({ projectId, service: serviceName, timestamp: { $gte: since } }),
      this.eventModel.countDocuments({
        projectId,
        service: serviceName,
        timestamp: { $gte: since },
        type: { $in: ['error', 'critical', 'warning'] },
      }),
      this.incidentModel.countDocuments({
        projectId,
        service: serviceName,
        detectedAt: { $gte: since },
      }),
    ]);

    if (totalEvents === 0 && serviceIncidents === 0) {
      return 99.97;
    }

    const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
    const incidentPenalty = Math.min(serviceIncidents * 0.15, 3);
    const uptime = 100 - errorRate * 100 - incidentPenalty;

    return Math.max(Math.min(Number(uptime.toFixed(2)), 100), 85);
  }

  formatUptime(uptime: number): string {
    return `${uptime.toFixed(2)}%`;
  }
}
