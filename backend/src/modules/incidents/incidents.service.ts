import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Event, EventDocument } from '../../common/schemas/event.schema';
import { AgentsService } from '../agents/agents.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private agentsService: AgentsService,
    private notificationsService: NotificationsService,
  ) {}

  async createIncident(projectId: string, incidentData: any) {
    const incidentId = uuid();

    // Get related events
    const recentEvents = await this.eventModel
      .find({ projectId, type: incidentData.type })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const incident = new this.incidentModel({
      projectId,
      incidentId,
      severity: incidentData.severity || 'warning',
      type: incidentData.type,
      service: incidentData.service,
      title: incidentData.title || `${incidentData.type.replace(/_/g, ' ').toUpperCase()} detected on ${incidentData.service}`,
      description: incidentData.description || incidentData.analysis?.reasoning || 'Incident detected by Helix',
      status: 'detecting',
      eventIds: recentEvents.map(e => e._id.toString()),
      detectedAt: new Date(),
      agentReasoning: {
        detectionAgent: {
          analysis: incidentData.analysis?.reasoning || '',
          confidence: incidentData.analysis?.confidence || 0,
          timestamp: new Date(),
        },
      },
    });

    const savedIncident = await incident.save();
    this.logger.debug(`Incident created: ${incidentId}`);

    // Trigger agent chain asynchronously
    this.agentsService
      .runAgentChain(projectId, savedIncident)
      .catch(err => {
        this.logger.error(`Agent chain failed: ${err.message}`);
      });

    return savedIncident;
  }

  async updateIncidentStatus(
    incidentId: string,
    status: string,
    updates?: any,
  ) {
    const incident = await this.incidentModel.findOne({ incidentId });
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = status;
    Object.assign(incident, updates);

    // If resolving, calculate resolution time
    if (status === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
      incident.resolutionTime =
        incident.resolvedAt.getTime() - incident.detectedAt.getTime();

      // Trigger postmortem generation
      this.agentsService
        .generatePostmortem(incident)
        .catch(err => {
          this.logger.error(`Postmortem generation failed: ${err.message}`);
        });
    }

    return incident.save();
  }

  async getIncidentsByProjectId(projectId: string, limit: number = 50) {
    return this.incidentModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getIncidentsBySeverity(projectId: string, severity: string) {
    return this.incidentModel
      .find({ projectId, severity })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getActiveIncidents(projectId: string) {
    return this.incidentModel
      .find({
        projectId,
        status: { $in: ['detecting', 'analyzing', 'responding'] },
      })
      .sort({ detectedAt: -1 })
      .lean();
  }

  async getResolvedIncidents(projectId: string, limit: number = 20) {
    return this.incidentModel
      .find({ projectId, status: 'resolved' })
      .sort({ resolvedAt: -1 })
      .limit(limit)
      .lean();
  }

  async getIncidentDetail(incidentId: string) {
    // Try to find by _id first (MongoDB ObjectId), then by incidentId field
    let incident = await this.incidentModel.findById(incidentId).lean();
    if (!incident) {
      incident = await this.incidentModel.findOne({ incidentId }).lean();
    }
    return incident;
  }

  async getAllIncidents(limit: number = 100) {
    // Public method for demo - returns all incidents across all projects
    return this.incidentModel
      .find()
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();
  }

  async checkForCorrelation(projectId: string): Promise<void> {
    // Check for multi-system correlation
    const recentIncidents = await this.incidentModel
      .find({
        projectId,
        status: { $in: ['detecting', 'analyzing', 'responding'] },
        detectedAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      })
      .sort({ detectedAt: -1 })
      .lean();

    if (recentIncidents.length >= 3) {
      // Trigger correlation analysis
      await this.agentsService.analyzeCorrelation(projectId, recentIncidents);
    }
  }

  async deleteIncident(incidentId: string) {
    const result = await this.incidentModel.findOneAndDelete({ incidentId });
    if (!result) {
      throw new Error('Incident not found');
    }
    return { message: `Incident ${incidentId} deleted`, deleted: true };
  }

  async deleteByType(type: string) {
    const result = await this.incidentModel.deleteMany({ type });
    return { message: `Deleted ${result.deletedCount} incidents of type ${type}`, deleted: result.deletedCount };
  }

  async runAnalysisForIncident(incidentId: string) {
    this.logger.log(`[RUN ANALYSIS] Starting for incident: ${incidentId}`);
    
    // Try to find by _id first (MongoDB ObjectId), then by incidentId field
    let incident = await this.incidentModel.findById(incidentId);
    if (!incident) {
      incident = await this.incidentModel.findOne({ incidentId });
    }
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    this.logger.log(`[RUN ANALYSIS] Found incident: ${incident.incidentId || incident._id}`);
    
    // Initialize agentReasoning if not present
    if (!incident.agentReasoning) {
      incident.agentReasoning = {};
      this.logger.log(`[RUN ANALYSIS] Initialized empty agentReasoning`);
    }
    
    // WAIT for the agent chain to complete (don't fire and forget)
    try {
      this.logger.log(`[RUN ANALYSIS] Invoking agent chain...`);
      await this.agentsService.runAgentChain(incident.projectId, incident);
      this.logger.log(`[RUN ANALYSIS] Agent chain completed successfully`);
    } catch (err) {
      const errMsg = (err as Error).message;
      this.logger.error(`[RUN ANALYSIS] Agent chain execution error: ${errMsg}`);
      throw err;
    }

    // Add a delay to ensure database writes have propagated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refresh incident from database to get all populated data
    this.logger.log(`[RUN ANALYSIS] Refreshing incident from database...`);
    const refreshedIncident = await this.incidentModel.findById(incident._id);
    
    if (!refreshedIncident) {
      throw new Error('Incident was deleted during analysis');
    }

    this.logger.log(`[RUN ANALYSIS] Incident refreshed. Status: ${refreshedIncident.status}, AgentReasoning keys: ${Object.keys(refreshedIncident.agentReasoning || {}).join(', ')}`);

    return { 
      message: 'Analysis completed for incident', 
      incidentId: refreshedIncident.incidentId || refreshedIncident._id,
      status: refreshedIncident.status,
      agentReasoning: refreshedIncident.agentReasoning,
      automaticActions: refreshedIncident.automaticActions
    };
  }

  async generatePostmortemForIncident(incidentId: string) {
    this.logger.log(`[GENERATE POSTMORTEM] Starting for incident: ${incidentId}`);
    
    // Try to find by _id first (MongoDB ObjectId), then by incidentId field
    let incident = await this.incidentModel.findById(incidentId);
    if (!incident) {
      incident = await this.incidentModel.findOne({ incidentId });
    }
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    this.logger.log(`[GENERATE POSTMORTEM] Found incident: ${incident.incidentId || incident._id}`);
    
    // Ensure agent reasoning exists
    if (!incident.agentReasoning) {
      incident.agentReasoning = {};
      this.logger.log(`[GENERATE POSTMORTEM] Initialized empty agentReasoning`);
    }

    // Generate postmortem
    this.logger.log(`[GENERATE POSTMORTEM] Generating postmortem content...`);
    const postmortem = await this.agentsService.generatePostmortem(incident);
    this.logger.log(`[GENERATE POSTMORTEM] Content generated, length: ${postmortem.content.length} chars`);
    
    // Store postmortem content in incident
    incident.postmortemContent = postmortem.content;
    incident.postmortemGeneratedAt = new Date();
    incident.markModified('postmortemContent');
    await incident.save();
    this.logger.log(`[GENERATE POSTMORTEM] Postmortem saved to database`);

    // Add a delay to ensure database writes have propagated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refresh to get latest data
    const refreshedIncident = await this.incidentModel.findById(incident._id);
    
    if (!refreshedIncident) {
      throw new Error('Incident was deleted during postmortem generation');
    }

    this.logger.log(`[GENERATE POSTMORTEM] Refresh complete. Has postmortemContent: ${!!refreshedIncident.postmortemContent}`);

    return {
      content: postmortem.content,
      timestamp: postmortem.timestamp,
      incidentId: refreshedIncident.incidentId || refreshedIncident._id,
      postmortemGeneratedAt: refreshedIncident.postmortemGeneratedAt
    };
  }
}
