import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async queryIncidents(projectId: string, query: string): Promise<string> {
    try {
      // Fetch last 50 incidents for context
      const incidents = await this.incidentModel
        .find({ projectId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Format incidents as context
      const incidentContext = incidents
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.type} on ${i.service} - ${i.status} - ${i.createdAt}`,
        )
        .join('\n');

      // In production, would send to LangChain or HuggingFace for natural language response
      const response = this.generateChatbotResponse(query, incidentContext);

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Chatbot query failed: ${err.message}`);
      return 'I encountered an error processing your query. Please try again.';
    }
  }

  private generateChatbotResponse(
    query: string,
    incidentContext: string,
  ): string {
    // Simple rule-based response (in production would use LangChain)
    if (query.toLowerCase().includes('recent')) {
      return `Based on the incident history, here are the most recent incidents... \n${incidentContext}`;
    }

    if (query.toLowerCase().includes('critical')) {
      return 'Critical incidents require immediate attention. Review the dashboard for current status.';
    }

    return `Here's what I found about your query: "${query}". \nIncident Context: \n${incidentContext}`;
  }
}
