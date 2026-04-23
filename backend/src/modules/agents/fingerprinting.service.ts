import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Event, EventDocument } from '../../common/schemas/event.schema';

@Injectable()
export class FingerprintingService {
  private readonly logger = new Logger(FingerprintingService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  /**
   * Generates a DNA signature for an incident based on its event sequence, timings, and metadata.
   */
  async generateFingerprint(incidentId: string): Promise<any> {
    const incident = await this.incidentModel.findOne({ incidentId }).exec();
    if (!incident) return null;

    const events = await this.eventModel.find({ 
      _id: { $in: incident.eventIds } 
    }).sort({ timestamp: 1 }).exec();

    if (events.length === 0) return null;

    const sequence = events.map(e => (e as any).type || (e as any).severity || 'unknown');
    const timings = [];
    for (let i = 1; i < events.length; i++) {
        const t1 = new Date((events[i] as any).createdAt || (events[i] as any).timestamp).getTime();
        const t2 = new Date((events[i-1] as any).createdAt || (events[i-1] as any).timestamp).getTime();
        timings.push(t1 - t2);
    }

    // Simple signature: concat types and normalized timings
    const signature = `${sequence.join('|')}:${this.normalizeTimings(timings)}`;

    return {
      signature,
      eventSequence: sequence,
      timingGaps: timings,
    };
  }

  private normalizeTimings(timings: number[]): string {
    // Round timings to nearest 500ms to allow fuzzy matching
    return timings.map(t => Math.round(t / 500) * 500).join(',');
  }

  /**
   * Compares an emerging incident's fingerprint against past incidents.
   */
  async findMatches(incidentId: string): Promise<{ matchScore: number; matchedIncidentId: string; rootCause: string } | null> {
    const currentFingerprint = await this.generateFingerprint(incidentId);
    if (!currentFingerprint) return null;

    const pastIncidents = await this.incidentModel.find({
      incidentId: { $ne: incidentId },
      status: 'resolved',
      'fingerprint.signature': { $exists: true }
    }).limit(50).exec();

    let bestMatch = null;
    let highestScore = 0;

    for (const past of pastIncidents) {
      const score = this.calculateSimilarity(currentFingerprint.signature, past.fingerprint.signature);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = past;
      }
    }

    if (highestScore >= 0.8 && bestMatch) {
      return {
        matchScore: highestScore,
        matchedIncidentId: bestMatch.incidentId,
        rootCause: (bestMatch as any).agentReasoning?.analysisAgent?.rootCause || 'Unknown past cause'
      };
    }

    return null;
  }

  private calculateSimilarity(sig1: string, sig2: string): number {
    if (sig1 === sig2) return 1.0;
    
    // Levenshtein-based similarity for event sequences
    const s1 = sig1.split(':')[0];
    const s2 = sig2.split(':')[0];
    
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }
}
