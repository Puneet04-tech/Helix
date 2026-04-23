import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>
  ) {}

  /**
   * Extracts resolution steps into a searchable knowledge base entry.
   */
  async crystallizeKnowledge(incidentId: string): Promise<any> {
    const incident = await this.incidentModel.findOne({ incidentId, status: 'resolved' }).exec();
    if (!incident) return null;

    const resolutionSteps = incident.agentReasoning?.responseAgent?.actions || [];
    const rootCause = incident.agentReasoning?.analysisAgent?.rootCause;

    const entry = {
      incidentType: incident.type,
      rootCause,
      fix: resolutionSteps.map(s => `${s.action} on ${s.target} (${s.success ? 'Success' : 'Failed'})`),
      duration: incident.resolutionTime,
      timestamp: new Date()
    };

    this.logger.log(`Knowledge crystallized for ${incident.type}: ${rootCause}`);
    return entry;
  }

  /**
   * Natural language search for past resolutions.
   */
  async queryKnowledge(query: string): Promise<any[]> {
    // In a real app, this would use Atlas Search or a Vector DB.
    // For this demo, we'll use regex on the rootCause and fix descriptions.
    const keywords = query.toLowerCase().split(' ');
    
    const matches = await this.incidentModel.find({
      status: 'resolved',
      $or: [
        { type: { $regex: keywords.join('|'), $options: 'i' } },
        { 'agentReasoning.analysisAgent.rootCause': { $regex: keywords.join('|'), $options: 'i' } }
      ]
    }).limit(5).exec();

    return matches.map(m => ({
      incidentId: m.incidentId,
      type: m.type,
      resolution: m.agentReasoning?.responseAgent?.actions,
      summary: `Fixed in ${Math.round((m.resolutionTime || 0) / 1000)}s via ${m.agentReasoning?.responseAgent?.actions?.[0]?.action || 'manual intervention'}`
    }));
  }
}
