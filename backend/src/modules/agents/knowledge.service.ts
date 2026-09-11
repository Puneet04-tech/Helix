import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { SemanticSearchService } from './semantic-search.service';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    private semanticSearchService: SemanticSearchService,
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
   * Natural language semantic search for past resolutions.
   * Uses real vector embeddings (HuggingFace sentence-transformers when available,
   * deterministic local hashing otherwise) for genuine semantic retrieval.
   */
  async queryKnowledge(query: string): Promise<any[]> {
    try {
      // Real semantic search via vector embeddings
      const results = await this.semanticSearchService.semanticSearch(query || '', 5);
      if (results.length > 0) {
        return results;
      }
    } catch (err) {
      this.logger.warn(`Semantic search failed: ${(err as Error).message}`);
    }

    // Safety fallback to regex search if semantic search is unavailable
    const keywords = (query || '')
      .toLowerCase()
      .split(' ')
      .map(k => k.trim())
      .filter(Boolean)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (keywords.length === 0) {
      return [];
    }

    const pattern = keywords.join('|');

    const matches = await this.incidentModel.find({
      status: 'resolved',
      $or: [
        { type: { $regex: pattern, $options: 'i' } },
        { 'agentReasoning.analysisAgent.rootCause': { $regex: pattern, $options: 'i' } },
      ],
    }).limit(5).exec();

    return matches.map(m => ({
      incidentId: m.incidentId,
      type: m.type,
      resolution: m.agentReasoning?.responseAgent?.actions,
      summary: `Fixed in ${Math.round((m.resolutionTime || 0) / 1000)}s via ${m.agentReasoning?.responseAgent?.actions?.[0]?.action || 'manual intervention'}`,
    }));
  }
}
