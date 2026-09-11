import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export type AgentRole = 'detection' | 'analysis' | 'response' | 'comms';
export type LlmProvider = 'groq' | 'gemini' | 'mistral' | 'ollama';

/**
 * Cloud LLM: Groq first (fastest free), then Gemini, then Mistral, finally Ollama fallback.
 */
@Injectable()
export class AgentLLMService {
  private readonly logger = new Logger(AgentLLMService.name);

  // Groq - Fastest free tier (30K TPM, sub-second responses)
  private readonly groqKey = process.env.GROQ_API_KEY;
  private readonly groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  // Gemini - Frontier quality (5 RPM, 100 RPD, 250K TPM)
  private readonly geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  private readonly geminiModels = [
    process.env.GEMINI_MODEL,
    'gemini-1.5-flash',  // Stable, widely available
    'gemini-1.5-flash-001',  // Specific version
    'gemini-2.5-flash',  // Current generation
  ].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);

  // Mistral - Good quality (1B tokens/month free)
  private readonly mistralKey = process.env.MISTRAL_API_KEY;
  private readonly mistralModel = process.env.MISTRAL_MODEL || 'mistral-small-latest';

  // Ollama - Local fallback (no API costs, slower)
  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  lastProvider: LlmProvider | null = null;

  async isAvailable(): Promise<boolean> {
    const hasGroq = !!this.groqKey;
    const hasGemini = !!this.geminiKey;
    const hasMistral = !!this.mistralKey;
    const hasOllama = !!this.ollamaUrl;
    
    if (!hasGroq && !hasGemini && !hasMistral && !hasOllama) {
      this.logger.error('No AI API keys configured. Set GROQ_API_KEY (recommended), GEMINI_API_KEY, MISTRAL_API_KEY, or OLLAMA_URL environment variables.');
    } else if (hasGroq) {
      this.logger.log('Groq API configured (recommended - fastest free tier)');
    } else if (hasGemini) {
      this.logger.warn('GEMINI_API_KEY set (frontier quality but low RPM)');
    } else if (hasMistral) {
      this.logger.warn('MISTRAL_API_KEY set (may have rate limits)');
    } else if (hasOllama) {
      this.logger.log('Ollama configured (local fallback - no API costs)');
    }
    
    return hasGroq || hasGemini || hasMistral || hasOllama;
  }

  async completeText(systemPrompt: string, userPrompt: string): Promise<string | null> {
    return this.complete(systemPrompt, userPrompt);
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

  async analyzeEventText(eventText: string): Promise<{
    isAnomaly: boolean;
    category: string;
    confidence: number;
    reasoning: string;
    source: LlmProvider;
  } | null> {
    const result = await this.completeJson(
      'You are a security and infrastructure anomaly detector. Respond ONLY with JSON.',
      `Event: ${eventText}

Respond ONLY with valid JSON:
{"isAnomaly":boolean,"category":"normal_activity"|"security_threat"|"performance_degradation"|"service_crash"|"unauthorized_access"|"rate_limit_exceeded"|"medical_incident"|"equipment_failure","confidence":0.0-1.0,"reasoning":"brief explanation"}

Only flag isAnomaly true if confidence > 0.65.`,
    );
    if (!result || !this.lastProvider) return null;
    return {
      isAnomaly: Boolean(result.isAnomaly),
      category: String(result.category || 'normal_activity'),
      confidence: Math.min(Math.max(Number(result.confidence) || 0, 0), 1),
      reasoning: String(result.reasoning || 'LLM analysis complete'),
      source: this.lastProvider,
    };
  }

  async runDetectionAgent(incident: {
    type: string;
    service: string;
    title?: string;
    description?: string;
    severity?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ analysis: string; confidence: number; timestamp: Date; source: LlmProvider } | null> {
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

    if (!result || typeof result.analysis !== 'string' || !this.lastProvider) return null;

    return {
      analysis: result.analysis,
      confidence: Math.min(Math.max(Number(result.confidence) || 0.75, 0), 1),
      timestamp: new Date(),
      source: this.lastProvider,
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
    affectedUsers: number;
    timestamp: Date;
    source: LlmProvider;
  } | null> {
    const prompt = `Incident:
- Type: ${incident.type}
- Service: ${incident.service}
- Severity: ${incident.severity || 'unknown'}
- Title: ${incident.title || 'N/A'}
- Description: ${incident.description || 'N/A'}

Recent correlated events:
${recentEvents || 'None available'}

Respond ONLY with JSON: {"rootCause":"string","affectedSystems":["system1"],"estimatedImpact":"string","affectedUsers":0}`;

    const result = await this.completeJson(
      'You are the Analysis Agent. Perform root cause analysis. Be specific and actionable. Estimate affectedUsers as an integer.',
      prompt,
    );

    if (!result || typeof result.rootCause !== 'string' || !this.lastProvider) return null;

    return {
      rootCause: result.rootCause,
      affectedSystems: Array.isArray(result.affectedSystems)
        ? result.affectedSystems.map(String)
        : [incident.service],
      estimatedImpact: String(result.estimatedImpact || 'Impact assessment pending'),
      affectedUsers: Math.max(0, Number(result.affectedUsers) || 0),
      timestamp: new Date(),
      source: this.lastProvider,
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
    source: LlmProvider;
  } | null> {
    const prompt = `Incident type: ${incident.type}, service: ${incident.service}, severity: ${incident.severity}
Metadata: ${JSON.stringify(incident.metadata || {})}

Respond ONLY with JSON:
{
  "playwrightAction": "restart_service"|"scale_up"|"clear_cache"|"failover"|"kill_process"|null,
  "actions": [{"action":"string","target":"string","result":"string","success":true}]
}
Limit to 3-5 concrete remediation actions. Do not invent successful browser results.`;

    const result = await this.completeJson(
      'You are the Response Agent. Plan automated remediation steps for this incident.',
      prompt,
    );

    if (!result || !Array.isArray(result.actions) || !this.lastProvider) return null;

    const validPlaywright = ['restart_service', 'scale_up', 'clear_cache', 'failover', 'kill_process'];
    const playwrightAction =
      typeof result.playwrightAction === 'string' && validPlaywright.includes(result.playwrightAction)
        ? result.playwrightAction
        : null;

    return {
      playwrightAction,
      source: this.lastProvider,
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
    source: LlmProvider;
  } | null> {
    const prompt = `Incident: type=${incident.type}, service=${incident.service}, severity=${incident.severity}

Respond ONLY with JSON:
{"notifications":[{"recipient":"role or team","channel":"email|sms|slack|console-alert","status":"queued"}]}
Include 2-5 stakeholders based on severity and incident type. Status must be queued until email is actually sent.`;

    const result = await this.completeJson(
      'You are the Communications Agent. Determine who must be notified and via which channels.',
      prompt,
    );

    if (!result || !Array.isArray(result.notifications) || !this.lastProvider) return null;

    return {
      source: this.lastProvider,
      notifications: result.notifications.slice(0, 6).map((n: Record<string, unknown>) => ({
        recipient: String(n.recipient || 'ops-team'),
        channel: String(n.channel || 'email'),
        status: 'queued',
      })),
    };
  }

  private async complete(systemPrompt: string, userPrompt: string): Promise<string | null> {
    this.lastProvider = null;

    // Try Groq first (fastest free tier)
    const groqResult = await this.tryGroq(systemPrompt, userPrompt);
    if (groqResult) {
      this.lastProvider = 'groq';
      return groqResult;
    }

    // Fallback to Gemini (frontier quality)
    const geminiResult = await this.tryGemini(systemPrompt, userPrompt);
    if (geminiResult) {
      this.lastProvider = 'gemini';
      return geminiResult;
    }

    // Fallback to Mistral (good quality)
    const mistralResult = await this.tryMistral(systemPrompt, userPrompt);
    if (mistralResult) {
      this.lastProvider = 'mistral';
      return mistralResult;
    }

    // Final fallback to Ollama (local, no API costs)
    const ollamaResult = await this.tryOllama(systemPrompt, userPrompt);
    if (ollamaResult) {
      this.lastProvider = 'ollama';
      return ollamaResult;
    }

    this.logger.error(
      'All LLM providers failed. Set GROQ_API_KEY (recommended), GEMINI_API_KEY, MISTRAL_API_KEY, or OLLAMA_URL on the host.',
    );
    return null;
  }

  private async tryGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.geminiKey) {
      this.logger.debug('GEMINI_API_KEY not set');
      return null;
    }

    this.logger.debug(`Attempting Gemini with ${this.geminiModels.length} models: ${this.geminiModels.join(', ')}`);

    for (const model of this.geminiModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`;
        this.logger.debug(`Trying Gemini model: ${model}`);
        
        const response = await axios.post(
          url,
          {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          },
          { timeout: 25000, headers: { 'Content-Type': 'application/json' } },
        );

        const text = response.data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || '')
          .join('')
          ?.trim();
        if (text) {
          this.logger.log(`Gemini completion succeeded (${model})`);
          return text;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        this.logger.warn(`Gemini ${model} failed${status ? ` (${status})` : ''}: ${message}`);
      }
    }
    return null;
  }

  private async tryMistral(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.mistralKey) {
      this.logger.debug('MISTRAL_API_KEY not set');
      return null;
    }

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: this.mistralModel,
          temperature: 0.2,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          timeout: 25000,
          headers: {
            Authorization: `Bearer ${this.mistralKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        this.logger.log(`Mistral completion succeeded (${this.mistralModel})`);
        return text;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 429) {
        this.logger.warn(`Mistral rate limited (429) - free tier quota exceeded. Consider upgrading or adding delay between requests.`);
      } else {
        this.logger.warn(`Mistral failed${status ? ` (${status})` : ''}: ${message}`);
      }
    }
    return null;
  }

  private async tryGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.groqKey) {
      this.logger.debug('GROQ_API_KEY not set');
      return null;
    }

    try {
      this.logger.debug(`Trying Groq with model: ${this.groqModel}`);
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.groqModel,
          temperature: 0.2,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          timeout: 25000,
          headers: {
            Authorization: `Bearer ${this.groqKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        this.logger.log(`Groq completion succeeded (${this.groqModel})`);
        return text;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      this.logger.warn(`Groq failed${status ? ` (${status})` : ''}: ${message}`);
    }
    return null;
  }

  private async tryOllama(systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (!this.ollamaUrl) {
      this.logger.debug('OLLAMA_URL not set');
      return null;
    }

    try {
      this.logger.debug(`Trying Ollama with model: ${this.ollamaModel}`);
      
      const response = await axios.post(
        `${this.ollamaUrl}/api/chat`,
        {
          model: this.ollamaModel,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          timeout: 60000, // Ollama can be slower on CPU
          headers: { 'Content-Type': 'application/json' },
        },
      );
      
      const text = response.data?.message?.content?.trim();
      if (text) {
        this.logger.log(`Ollama completion succeeded (${this.ollamaModel})`);
        return text;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Ollama failed: ${message}`);
    }
    return null;
  }
}
