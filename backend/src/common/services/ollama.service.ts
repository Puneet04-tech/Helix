import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface AnalysisResult {
  isAnomaly: boolean;
  category: string;
  confidence: number;
  reasoning: string;
  source: 'ollama' | 'statistical' | 'behavioral' | 'pattern' | 'fallback';
  details?: {
    scores?: { [key: string]: number };
    signals?: string[];
  };
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  
  private ollamaAvailable = false;
  private readonly OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  private readonly OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
  private readonly OLLAMA_TIMEOUT = 30000;

  constructor() {
    this.checkOllamaAvailability();
  }

  /**
   * Check if Ollama is running and accessible
   */
  async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.OLLAMA_URL}/api/tags`, {
        timeout: 5000,
      });
      this.ollamaAvailable = !!response.data?.models?.length;
      this.logger.log(`✓ Ollama is ${this.ollamaAvailable ? 'available' : 'unavailable'}`);
      return this.ollamaAvailable;
    } catch (error) {
      this.logger.warn('Ollama not available - will use fallback analysis');
      this.ollamaAvailable = false;
      return false;
    }
  }

  /**
   * Analyze event using Ollama
   */
  async analyzeWithOllama(eventText: string): Promise<AnalysisResult | null> {
    if (!this.ollamaAvailable) {
      await this.checkOllamaAvailability();
      if (!this.ollamaAvailable) return null;
    }

    try {
      this.logger.debug(`Analyzing with Ollama (${this.OLLAMA_MODEL})`);

      const prompt = this.buildAnalysisPrompt(eventText);

      const response = await axios.post(
        `${this.OLLAMA_URL}/api/generate`,
        {
          model: this.OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          temperature: 0.3, // Lower temp for consistency
        },
        { timeout: this.OLLAMA_TIMEOUT }
      );

      const analysis = this.parseOllamaResponse(response.data.response);
      return {
        ...analysis,
        source: 'ollama',
      };
    } catch (error) {
      const err = error as any;
      this.logger.warn(`Ollama analysis failed: ${err.message}`);
      this.ollamaAvailable = false;
      return null;
    }
  }

  /**
   * Build analysis prompt for Ollama
   */
  private buildAnalysisPrompt(eventText: string): string {
    return `You are a security and infrastructure anomaly detection system. Analyze the following event and provide a JSON response.

Event: ${eventText}

Respond ONLY with a valid JSON object (no markdown, no code blocks, just raw JSON):
{
  "isAnomaly": boolean,
  "category": "normal_activity" | "security_threat" | "performance_degradation" | "service_crash" | "unauthorized_access" | "rate_limit_exceeded",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}

Be strict: only flag as anomaly if confidence > 0.65.`;
  }

  /**
   * Parse Ollama response
   */
  private parseOllamaResponse(response: string): Omit<AnalysisResult, 'source'> {
    try {
      // Extract JSON from response (Ollama might include extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        isAnomaly: parsed.isAnomaly ?? false,
        category: parsed.category ?? 'normal_activity',
        confidence: Math.min(Math.max(parsed.confidence ?? 0, 0), 1),
        reasoning: parsed.reasoning ?? 'Analysis complete',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse Ollama response: ${error}`);
      return {
        isAnomaly: false,
        category: 'normal_activity',
        confidence: 0,
        reasoning: 'Parse error - treating as normal',
      };
    }
  }

  /**
   * Get Ollama status
   */
  async getStatus(): Promise<{
    available: boolean;
    model: string;
    url: string;
    message: string;
  }> {
    const available = await this.checkOllamaAvailability();
    return {
      available,
      model: this.OLLAMA_MODEL,
      url: this.OLLAMA_URL,
      message: available
        ? `Ollama is ready (${this.OLLAMA_MODEL})`
        : 'Ollama not available - using fallback analysis',
    };
  }
}
