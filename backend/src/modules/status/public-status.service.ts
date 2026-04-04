import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';

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
  ) {}

  /**
   * Get public status page data for a client
   * No authentication required - suitable for public display
   */
  async getPublicStatusPage(clientId: string): Promise<any> {
    try {
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
        ? this.formatServiceStatus(client.statusSummary as any)
        : this.generateDefaultServiceStatus();

      // Calculate metrics
      const totalIncidents = await this.incidentModel.countDocuments({
        projectId: clientId,
      });

      const activeIncidents = await this.incidentModel.countDocuments({
        projectId: clientId,
        status: { $in: ['detecting', 'analyzing', 'responding'] },
      });

      const avgResolutionTime = this.calculateAverageResolutionTime(recentIncidents);

      return {
        clientName: client.name,
        statusPage: {
          services: serviceStatus,
          overview: {
            totalIncidents,
            activeIncidents,
            resolvedIncidents: recentIncidents.length,
            averageResolutionTimeMinutes: avgResolutionTime,
            uptime: '99.97%',
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
  private generateDefaultServiceStatus(): Array<{ name: string; status: string; uptime: string; responseTime: string; lastUpdated: Date }> {
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

    return defaultServices.map(service => ({
      name: service,
      status: 'operational',
      uptime: '99.97%',
      responseTime: '120ms',
      lastUpdated: new Date(),
    }));
  }

  /**
   * Format service status object to array
   */
  private formatServiceStatus(statusSummary: { [key: string]: string }): Array<{ name: string; status: string; uptime: string; responseTime: string; lastUpdated: Date }> {
    return Object.entries(statusSummary).map(([name, status]) => ({
      name,
      status,
      uptime: status === 'operational' ? '99.97%' : status === 'degraded' ? '95.5%' : '0%',
      responseTime: status === 'operational' ? '120ms' : 'N/A',
      lastUpdated: new Date(),
    }));
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
