import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

/**
 * Feature 7: Multi-System Correlation
 * Detects and correlates incidents across services within the same time window
 */
@Injectable()
export class CorrelationService {
  private readonly logger = new Logger(CorrelationService.name);
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private recentIncidents = new Map<string, any[]>(); // projectId -> [incidents with timestamp]

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  /**
   * Track incident creation and check for correlations
   */
  async checkForCorrelations(incident: IncidentDocument): Promise<void> {
    try {
      const projectId = incident.projectId.toString();

      // Initialize project tracking if needed
      if (!this.recentIncidents.has(projectId)) {
        this.recentIncidents.set(projectId, []);
      }

      // Add incident with timestamp
      const incidentList = this.recentIncidents.get(projectId) || [];
      incidentList.push({
        ...incident.toObject(),
        trackingTime: Date.now(),
      });

      // Keep only incidents from last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recentList = incidentList.filter(i => i.trackingTime > fiveMinutesAgo);
      this.recentIncidents.set(projectId, recentList);

      // Check if we have 3+ incidents across different services
      const uniqueServices = new Set(recentList.map(i => i.service));

      if (recentList.length >= 3 && uniqueServices.size >= 3) {
        await this.analyzeCorrelation(projectId, recentList, incident);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to check correlations: ${err.message}`);
    }
  }

  /**
   * Analyze correlation and find common root cause
   */
  private async analyzeCorrelation(projectId: string, incidents: any[], newIncident: IncidentDocument): Promise<void> {
    try {
      const correlated = incidents.filter(i => i.service !== newIncident.service);

      if (correlated.length < 2) {
        return;
      }

      this.logger.debug(`Analyzing correlation for ${correlated.length + 1} incidents`);

      // Format incidents for LLM analysis
      const incidentDetails = [newIncident, ...correlated]
        .slice(0, 5) // Limit to 5 incidents
        .map((inc: any) => `- ${inc.service}: ${inc.type} (${inc.description})`)
        .join('\n');

      // Call LLM to analyze correlation
      const hypothesis = await this.analyzeWithLLM(incidentDetails);

      // Update all correlated incidents with correlation note
      const incidentIds = [newIncident._id, ...correlated.map(i => i._id)];

      await this.incidentModel.updateMany(
        { _id: { $in: incidentIds } },
        {
          $set: {
            correlationNote: hypothesis,
            correlatedIncidentIds: incidentIds.filter((id: any) => id !== newIncident._id),
            isCorrelated: true,
          },
        },
      );

      this.logger.debug(`Correlation note added: ${hypothesis.substring(0, 100)}...`);

      // Optionally send alert to admin about correlation
      await this.sendCorrelationAlert(projectId, [newIncident, ...correlated], hypothesis);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to analyze correlation: ${err.message}`);
    }
  }

  /**
   * Use LLM to analyze root cause correlation
   */
  private async analyzeWithLLM(incidentDetails: string): Promise<string> {
    try {
      const prompt = `These services all experienced incidents within the same 5-minute window:
${incidentDetails}

What is the most likely shared root cause? Consider:
- Shared databases or data stores
- Shared network segments or load balancers
- Shared upstream dependencies (DNS, CDN, auth service)
- Recent deployment events
- Infrastructure issues

Return your hypothesis as ONE plain English sentence only (no elaboration).`;

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'mistral',
          prompt,
          stream: false,
          temperature: 0.3,
        },
        { timeout: 30000 },
      );

      return response.data.response.trim().split('\n')[0]; // Get first line only
    } catch (error) {
      this.logger.warn('LLM correlation analysis failed, using default');
      return 'Multiple services experienced issues in the same time window, suggesting a shared infrastructure problem.';
    }
  }

  /**
   * Send alert about correlated incidents
   */
  private async sendCorrelationAlert(projectId: string, incidents: any[], hypothesis: string): Promise<void> {
    try {
      const services = incidents.map((i: any) => i.service).join(', ');

      this.logger.debug(`🔗 CORRELATION DETECTED: ${services}`);
      this.logger.debug(`📌 Hypothesis: ${hypothesis}`);

      // In production, this would send an email alert to the client's admin
      // await this.notificationsService.sendCorrelationAlert(projectId, incidents, hypothesis);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send correlation alert: ${err.message}`);
    }
  }

  /**
   * Get correlated incident groups for a client
   */
  async getCorrelatedIncidentGroups(projectId: string): Promise<any[]> {
    try {
      const correlated = await this.incidentModel
        .find({
          projectId,
          isCorrelated: true,
        })
        .sort({ detectedAt: -1 })
        .lean();

      // Group by correlation
      const groups: Map<string, any[]> = new Map();

      for (const incident of correlated) {
        const key = (incident.correlationNote || 'uncategorized').substring(0, 50);
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(incident);
      }

      return Array.from(groups.entries()).map(([hypothesis, incidents]) => ({
        hypothesis,
        incidentCount: incidents.length,
        incidents: incidents.slice(0, 5), // Show first 5
        services: [...new Set(incidents.map(i => i.service))],
      }));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get correlated groups: ${err.message}`);
      return [];
    }
  }
}
