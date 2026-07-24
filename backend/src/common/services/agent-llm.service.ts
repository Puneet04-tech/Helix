import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OllamaService } from './ollama.service';
import { GroqService } from './groq.service';

export type AgentRole = 'detection' | 'analysis' | 'response' | 'comms';

@Injectable()
export class AgentLLMService {
  private readonly logger = new Logger(AgentLLMService.name);
  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'mistral';
  private readonly groqApiKey = process.env.GROQ_API_KEY;
  private readonly groqModel = 'llama-3.1-8b-instant';

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly groqService: GroqService,
  ) {}

  async isAvailable(): Promise<boolean> {
    const ollama = await this.ollamaService.getStatus();
    if (ollama.available) return true;
    const groq = await this.groqService.getStatus();
    return groq.available;
  }

  async completeJson(systemPrompt: string, userPrompt: string): Promise<Record<string, unknown> | null> {
    const raw = await this.complete(systemPrompt, userPrompt);
    if (!raw) return null;

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch {
      this.logger.warn('Failed to parse LLM JSON response');
      return null;
    }
  }

  async runDetectionAgent(incident: {
    type: string;
    service: string;
    title?: string;
    description?: string;
    severity?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ analysis: string; confidence: number; timestamp: Date } | null> {
    const prompt = `Incident:
- Type: ${incident.type}
- Service: ${incident.service}
- Severity: ${incident.severity || 'unknown'}
- Title: ${incident.title || 'N/A'}
- Description: ${incident.description || 'N/A'}
- Metadata: ${JSON.stringify(incident.metadata || {})}`;

    const result = await this.completeJson(
      'You are the Detection Agent in an autonomous incident response system. Analyze the incident and respond ONLY with JSON: {"analysis":"string","confidence":0.0-1.0}',
      prompt,
    );

    if (!result || typeof result.analysis !== 'string') return null;

    return {
      analysis: result.analysis,
      confidence: Math.min(Math.max(Number(result.confidence) || 0.75, 0), 1),
      timestamp: new Date(),
    };
  }

  async runAnalysisAgent(
    incident: {
      type: string;
      service: string;
      title?: string;
      description?: string;
      severity?: string;
    },
    recentEvents?: string,
  ): Promise<{
    rootCause: string;
    affectedSystems: string[];
    estimatedImpact: string;
    timestamp: Date;
  } | null> {
    const prompt = `Incident:
- Type: ${incident.type}
- Service: ${incident.service}
- Severity: ${incident.severity || 'unknown'}
- Title: ${incident.title || 'N/A'}
- Description: ${incident.description || 'N/A'}

Recent correlated events:
${recentEvents || 'None available'}

Respond ONLY with JSON: {"rootCause":"string","affectedSystems":["system1"],"estimatedImpact":"string"}`;

    const result = await this.completeJson(
      'You are the Analysis Agent. Perform root cause analysis. Be specific and actionable.',
      prompt,
    );

    if (!result || typeof result.rootCause !== 'string') return null;

    return {
      rootCause: result.rootCause,
      affectedSystems: Array.isArray(result.affectedSystems)
        ? result.affectedSystems.map(String)
        : [incident.service],
      estimatedImpact: String(result.estimatedImpact || 'Impact assessment pending'),
      timestamp: new Date(),
    };
  }

  async runResponsePlan(incident: {
    type: string;
    service: string;
    severity?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    actions: Array<{ action: string; target: string; result: string; success: boolean }>;
    playwrightAction: string | null;
  } | null> {
    const prompt = `Incident type: ${incident.type}, service: ${incident.service}, severity: ${incident.severity}
Metadata: ${JSON.stringify(incident.metadata || {})}

Respond ONLY with JSON:
{
  "playwrightAction": "restart_service"|"scale_up"|"clear_cache"|"failover"|"kill_process"|null,
  "actions": [{"action":"string","target":"string","result":"string","success":true}]
}
Limit to 3-5 concrete remediation actions.`;

    const result = await this.completeJson(
      'You are the Response Agent. Plan automated remediation steps for this incident.',
      prompt,
    );

    if (!result || !Array.isArray(result.actions)) return null;

    const validPlaywright = ['restart_service', 'scale_up', 'clear_cache', 'failover', 'kill_process'];
    const playwrightAction =
      typeof result.playwrightAction === 'string' && validPlaywright.includes(result.playwrightAction)
        ? result.playwrightAction
        : null;

    return {
      playwrightAction,
      actions: result.actions.slice(0, 5).map((a: Record<string, unknown>) => ({
        action: String(a.action || 'remediate'),
        target: String(a.target || incident.service),
        result: String(a.result || 'Action planned by AI agent'),
        success: a.success !== false,
      })),
    };
  }

  async runCommsPlan(incident: {
    type: string;
    service: string;
    severity?: string;
  }): Promise<{
    notifications: Array<{ recipient: string; channel: string; status: string }>;
  } | null> {
    const prompt = `Incident: type=${incident.type}, service=${incident.service}, severity=${incident.severity}

Respond ONLY with JSON:
{"notifications":[{"recipient":"role or team","channel":"email|sms|slack|console-alert","status":"sent"}]}
Include 2-5 stakeholders based on severity and incident type.`;

    const result = await this.completeJson(
      'You are the Communications Agent. Determine who must be notified and via which channels.',
      prompt,
    );

    if (!result || !Array.isArray(result.notifications)) return null;

    return {
      notifications: result.notifications.slice(0, 6).map((n: Record<string, unknown>) => ({
        recipient: String(n.recipient || 'ops-team'),
        channel: String(n.channel || 'email'),
        status: String(n.status || 'sent'),
      })),
    };
  }

  private async complete(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const ollamaResult = await this.tryOllama(systemPrompt, userPrompt);
    if (ollamaResult) return ollamaResult;

    const groqResult = await this.tryGroq(systemPrompt, userPrompt);
    if (groqResult) return groqResult;

    return null;
  }

  private async tryOllama(systemPrompt: string, userPrompt: string): Promise<string | null> {
    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 3000 });
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.ollamaModel,
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          temperature: 0.2,
        },
        { timeout: 45000 },
      );
      const text = response.data?.response?.trim();
      return text || null;
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
          temperature: 0.2,
          max_tokens: 800,
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
      this.logger.debug(`Groq agent completion failed: ${message}`);
      return null;
    }
  }
}
