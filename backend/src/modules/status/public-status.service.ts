import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { UptimeCalculatorService } from '../../common/services/uptime-calculator.service';

/**
 * Feature 5: Guest-Facing Auto Status Page
 * Provides public status information without authentication
 */
@Injectable()
export class PublicStatusService {
  private readonly logger = new Logger(PublicStatusService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private uptimeCalculator: UptimeCalculatorService,
  ) {}

  /**
   * Get public status page data for a client
   * No authentication required - suitable for public display
   */
  async getPublicStatusPage(clientId: string): Promise<any> {
    try {
      // clientId is the Client's Mongo _id (same value stored on incidents as projectId).
      if (!Types.ObjectId.isValid(clientId)) {
        return { error: 'Client not found' };
      }
      const client = await this.clientModel.findById(clientId).lean();
      if (!client) {
        return { error: 'Client not found' };
      }

      // Get last 10 resolved incidents
      const recentIncidents = await this.incidentModel
        .find({
          projectId: clientId,
          status: 'resolved',
        })
        .sort({ resolvedAt: -1 })
        .limit(10)
        .lean();

      // Calculate service status from statusSummary field
      const serviceStatus = (client.statusSummary && typeof client.statusSummary === 'object' && !Array.isArray(client.statusSummary)) 
        ? await this.formatServiceStatus(clientId, client.statusSummary as any)
        : await this.generateDefaultServiceStatus(clientId);

      // Calculate metrics
      const totalIncidents = await this.incidentModel.countDocuments({
        projectId: clientId,
      });

      const activeIncidents = await this.incidentModel.countDocuments({
        projectId: clientId,
        status: { $in: ['detecting', 'analyzing', 'responding'] },
      });

      const avgResolutionTime = this.calculateAverageResolutionTime(recentIncidents);
      const projectUptime = await this.uptimeCalculator.calculateProjectUptime(clientId);

      return {
        clientName: client.name,
        statusPage: {
          services: serviceStatus,
          overview: {
            totalIncidents,
            activeIncidents,
            resolvedIncidents: recentIncidents.length,
            averageResolutionTimeMinutes: avgResolutionTime,
            uptime: this.uptimeCalculator.formatUptime(projectUptime),
            lastUpdated: new Date(),
          },
          recentResolutions: recentIncidents.map((incident: any) => ({
            type: incident.type,
            service: incident.service,
            resolvedAt: incident.resolvedAt,
            duration: incident.resolutionTime ? `${(incident.resolutionTime / 1000 / 60).toFixed(1)}m` : 'N/A',
          })),
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get public status: ${err.message}`);
      return { error: 'Unable to fetch status information' };
    }
  }

  /**
   * Update service status summary when incident status changes
   */
  async updateServiceStatus(projectId: string, serviceName: string, status: 'operational' | 'degraded' | 'outage'): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(projectId)) return;
      const client = await this.clientModel.findById(projectId);
      if (!client) return;

      if (!client.statusSummary || typeof client.statusSummary !== 'object' || Array.isArray(client.statusSummary)) {
        // Initialize as an object, not array
        client.statusSummary = {};
      }

      (client.statusSummary as any)[serviceName] = status;

      await client.save();
      this.logger.debug(`Updated service status for ${serviceName}: ${status}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update service status: ${err.message}`);
    }
  }

  /**
   * Get default service status (all operational)
   */
  private async generateDefaultServiceStatus(clientId: string): Promise<Array<{ name: string; status: string; uptime: string; responseTime: string; lastUpdated: Date }>> {
    const defaultServices = [
      'API Gateway',
      'Authentication',
      'Database',
      'Message Queue',
      'Cache Layer',
      'Payment Processing',
      'Email Service',
      'File Storage',
    ];

    return Promise.all(
      defaultServices.map(async service => {
        const uptimeValue = await this.uptimeCalculator.calculateServiceUptime(clientId, service);
        return {
          name: service,
          status: 'operational',
          uptime: this.uptimeCalculator.formatUptime(uptimeValue),
          responseTime: '120ms',
          lastUpdated: new Date(),
        };
      }),
    );
  }

  /**
   * Format service status object to array
   */
  private async formatServiceStatus(
    clientId: string,
    statusSummary: { [key: string]: string },
  ): Promise<Array<{ name: string; status: string; uptime: string; responseTime: string; lastUpdated: Date }>> {
    return Promise.all(
      Object.entries(statusSummary).map(async ([name, status]) => {
        const uptimeValue = await this.uptimeCalculator.calculateServiceUptime(clientId, name);
        return {
          name,
          status,
          uptime: this.uptimeCalculator.formatUptime(uptimeValue),
          responseTime: status === 'operational' ? '120ms' : 'N/A',
          lastUpdated: new Date(),
        };
      }),
    );
  }

  /**
   * Calculate average resolution time from incidents
   */
  private calculateAverageResolutionTime(incidents: any[]): number {
    if (incidents.length === 0) return 0;

    const totalTime = incidents.reduce((sum: number, incident: any) => {
      return sum + (incident.resolutionTime || 0);
    }, 0);

    return Math.round((totalTime / 1000 / 60) / incidents.length); // Convert to minutes
  }
}
