import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class NaturalLanguageQueryService {
  private readonly logger = new Logger(NaturalLanguageQueryService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'mistral';
  private readonly groqApiKey = process.env.GROQ_API_KEY;
  private readonly groqModel = 'llama-3.1-8b-instant';

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async queryIncidents(projectId: string, query: string): Promise<string> {
    try {
      const incidents = await this.incidentModel
        .find({ projectId })
        .sort({ detectedAt: -1 })
        .limit(50)
        .lean();

      if (incidents.length === 0) {
        return 'No incidents found for this project yet.';
      }

      const formattedIncidents = this.formatIncidentsForLLM(incidents);
      const systemPrompt = `You are Helix AI Guardian, an autonomous incident response assistant.
Answer questions about incidents using only the provided data.
Be concise (2-4 sentences), actionable, and accurate.`;

      const userPrompt = `Incident Data:
${formattedIncidents}

User Question: ${query}`;

      const llmAnswer = await this.callLLM(systemPrompt, userPrompt);
      if (llmAnswer) {
        this.logger.debug(`NLP query processed for project ${projectId}`);
        return llmAnswer;
      }

      return this.buildDataDrivenFallback(incidents, query);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process NLP query: ${err.message}`);
      return 'Unable to process your question at this time. Please try again later.';
    }
  }

  private formatIncidentsForLLM(incidents: any[]): string {
    return incidents
      .map((incident, index) => {
        const date = new Date(incident.detectedAt).toLocaleString();
        const resolutionTime = incident.resolutionTime
          ? `${(incident.resolutionTime / 1000 / 60).toFixed(1)} minutes`
          : 'Not resolved yet';

        return `${index + 1}. ${incident.type.toUpperCase()} on ${incident.service}
   Date: ${date}
   Severity: ${incident.severity}
   Status: ${incident.status}
   Title: ${incident.title}
   Description: ${incident.description}
   Root Cause: ${incident.agentReasoning?.analysisAgent?.rootCause || incident.rootCause || 'Still investigating'}
   Resolution Time: ${resolutionTime}`;
      })
      .join('\n');
  }

  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const ollama = await this.tryOllama(systemPrompt, userPrompt);
    if (ollama) return ollama;

    const groq = await this.tryGroq(systemPrompt, userPrompt);
    if (groq) return groq;

    return null;
  }

  private async tryOllama(systemPrompt: string, userPrompt: string): Promise<string | null> {
    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.ollamaModel,
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          temperature: 0.3,
        },
        { timeout: 30000 },
      );
      return response.data?.response?.trim() || null;
    } catch {
      return null;
    }
  }

  private async tryGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.groqApiKey) return null;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );
      return response.data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Groq NLP fallback failed: ${message}`);
      return null;
    }
  }

  private buildDataDrivenFallback(incidents: any[], query: string): string {
    const q = query.toLowerCase();
    const active = incidents.filter(i => !['resolved', 'analyzed'].includes(i.status));
    const critical = incidents.filter(i => i.severity === 'critical');

    if (q.includes('last night') || q.includes('recent') || q.includes('latest')) {
      const latest = incidents[0];
      return `Most recent incident: ${latest.type} on ${latest.service} (${latest.severity}) — ${latest.title || latest.description}. Status: ${latest.status}.`;
    }

    if (q.includes('critical') || q.includes('urgent')) {
      return critical.length
        ? `There are ${critical.length} critical incident(s). Latest: ${critical[0].type} on ${critical[0].service}.`
        : 'No critical incidents in the recent history.';
    }

    if (q.includes('active') || q.includes('open')) {
      return active.length
        ? `${active.length} active incident(s). Most recent: ${active[0].type} on ${active[0].service}.`
        : 'No active incidents — systems appear stable.';
    }

    const resolved = incidents.filter(i => i.status === 'resolved').length;
    return `Based on ${incidents.length} recent incidents: ${active.length} active, ${resolved} resolved, ${critical.length} critical. Check the dashboard for full agent analysis and automated actions taken.`;
  }
}
