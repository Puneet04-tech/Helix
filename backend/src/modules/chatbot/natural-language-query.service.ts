import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

/**
 * Feature 2: Natural Language Incident Querying
 * Uses Ollama to answer questions about incidents in natural language
 */
@Injectable()
export class NaturalLanguageQueryService {
  private readonly logger = new Logger(NaturalLanguageQueryService.name);
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  /**
   * Process natural language query about incidents
   */
  async queryIncidents(projectId: string, query: string): Promise<string> {
    try {
      // Fetch last 50 incidents for this client
      const incidents = await this.incidentModel
        .find({ projectId })
        .sort({ detectedAt: -1 })
        .limit(50)
        .lean();

      if (incidents.length === 0) {
        return 'No incidents found for this project yet.';
      }

      // Format incidents as readable text
      const formattedIncidents = this.formatIncidentsForLLM(incidents);

      // Build LLM prompt
      const systemPrompt = `You are Helix, an intelligent security assistant for threat detection and incident management.
Your role is to answer questions about client incidents and security events based on the provided data.
Answer in plain English, suitable for non-technical managers and technical teams.
Keep responses concise (2-3 sentences maximum) and focus on business impact and actionable recommendations.
Always prioritize clarity and accuracy.`;

      const userPrompt = `Incident Data:
${formattedIncidents}

User Question: ${query}

Please answer the user's question based only on the incident data provided above. If the data doesn't contain information to answer the question, say so clearly.`;

      // Call Ollama for inference
      const response = await this.callOllama(systemPrompt, userPrompt);

      this.logger.debug(`NLP query processed for project ${projectId}`);
      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process NLP query: ${err.message}`);
      return 'Unable to process your question at this time. Please try again later.';
    }
  }

  /**
   * Format incidents into readable text for LLM context
   */
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
   Root Cause: ${incident.rootCause || 'Still investigating'}
   Resolution Time: ${resolutionTime}
   `;
      })
      .join('\n');
  }

  /**
   * Call Ollama API for LLM inference
   */
  private async callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      // Check if Ollama is available
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'mistral',
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          temperature: 0.3,
          top_p: 0.9,
        },
        { timeout: 30000 },
      );

      return response.data.response.trim();
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Ollama not available, using fallback: ${err.message}`);
      return this.getFallbackResponse();
    }
  }

  /**
   * Fallback response if Ollama is not available
   */
  private getFallbackResponse(): string {
    return 'Based on our incident data, your system has experienced some recent issues. Please check the incident dashboard for detailed analysis.';
  }
}
