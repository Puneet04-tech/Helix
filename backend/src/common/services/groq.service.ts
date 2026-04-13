import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface AnalysisResult {
  isAnomaly: boolean;
  category: string;
  confidence: number;
  reasoning: string;
  source: 'groq' | 'statistical' | 'behavioral' | 'pattern' | 'fallback';
  details?: {
    scores?: { [key: string]: number };
    signals?: string[];
  };
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  private groqAvailable = false;
  private readonly GROQ_API_KEY = process.env.GROQ_API_KEY;
  private readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly GROQ_MODEL = 'llama-3.1-8b-instant'; // Fast, free, and currently available
  private readonly GROQ_TIMEOUT = 30000;

  constructor() {
    if (this.GROQ_API_KEY) {
      // Check availability on first use, not on construction
      this.logger.log('Groq service initialized (will test API on first use)');
    } else {
      this.logger.warn('GROQ_API_KEY not set - Groq service will not be available');
    }
  }

  /**
   * Check if Groq API is accessible
   */
  async checkGroqAvailability(): Promise<boolean> {
    if (!this.GROQ_API_KEY) {
      this.groqAvailable = false;
      return false;
    }

    try {
      // Test with a simple query
      const response = await axios.post(
        this.GROQ_API_URL,
        {
          model: this.GROQ_MODEL,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.groqAvailable = !!response.data?.choices;
      this.logger.log(`✓ Groq API is ${this.groqAvailable ? 'available' : 'unavailable'}`);
      return this.groqAvailable;
    } catch (error) {
      const err = error as any;
      const status = err.response?.status;
      const data = err.response?.data;
      this.logger.warn(`Groq API check failed - Status: ${status}, Message: ${err.message}, Details: ${JSON.stringify(data)}`);
      this.groqAvailable = false;
      return false;
    }
  }

  /**
   * Analyze event using Groq API
   */
  async analyzeWithGroq(eventText: string): Promise<AnalysisResult | null> {
    if (!this.GROQ_API_KEY) {
      this.logger.debug('Groq API key not configured');
      return null;
    }

    if (!this.groqAvailable) {
      await this.checkGroqAvailability();
      if (!this.groqAvailable) return null;
    }

    try {
      this.logger.debug('Analyzing with Groq API');

      const prompt = this.buildAnalysisPrompt(eventText);

      const response = await axios.post(
        this.GROQ_API_URL,
        {
          model: this.GROQ_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: this.GROQ_TIMEOUT,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Groq response');
      }

      const analysis = this.parseGroqResponse(content);
      return {
        ...analysis,
        source: 'groq',
      };
    } catch (error) {
      const err = error as any;
      const status = err.response?.status;
      const data = err.response?.data;
      this.logger.warn(`Groq analysis failed - Status: ${status}, Message: ${err.message}, Response: ${JSON.stringify(data)}`);
      this.groqAvailable = false;
      return null;
    }
  }

  /**
   * Build analysis prompt
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
   * Parse Groq response
   */
  private parseGroqResponse(response: string): Omit<AnalysisResult, 'source'> {
    try {
      // Extract JSON from response
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
      this.logger.warn(`Failed to parse Groq response: ${error}`);
      return {
        isAnomaly: false,
        category: 'normal_activity',
        confidence: 0,
        reasoning: 'Parse error - treating as normal',
      };
    }
  }

  /**
   * Get Groq status
   */
  async getStatus(): Promise<{
    available: boolean;
    model: string;
    message: string;
  }> {
    const available = await this.checkGroqAvailability();
    return {
      available,
      model: this.GROQ_MODEL,
      message: available
        ? `Groq API is ready (${this.GROQ_MODEL})`
        : 'Groq API not available - using fallback analysis',
    };
  }
}
