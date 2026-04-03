import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async getPublicStatus(clientId: string) {
    try {
      const client = await this.clientModel.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Get last 10 resolved incidents
      const incidents = await this.incidentModel
        .find({ projectId: clientId, status: 'resolved' })
        .sort({ resolvedAt: -1 })
        .limit(10)
        .lean();

      // Build service status from client's statusSummary
      const serviceStatus = client.monitoredServices.map(service => ({
        name: service,
        status: client.statusSummary?.[service] || 'operational',
        uptime: Math.random() * 5 === 0 ? 99.5 : 99.99, // Placeholder
      }));

      return {
        organization: client.name,
        lastUpdated: new Date(),
        serviceStatus,
        recentIncidents: incidents.map(i => ({
          id: i.incidentId,
          type: i.type,
          service: i.service,
          resolvedAt: i.resolvedAt,
          duration: i.resolutionTime,
        })),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get public status: ${err.message}`);
      return {
        organization: 'Unknown',
        lastUpdated: new Date(),
        serviceStatus: [],
        recentIncidents: [],
        error: 'Unable to fetch status',
      };
    }
  }
}
