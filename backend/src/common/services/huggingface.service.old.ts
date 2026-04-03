import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface AnalysisResult {
  isAnomaly: boolean;
  category: string;
  confidence: number;
  reasoning: string;
  source: 'hf_api' | 'local' | 'fallback';
}

interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
}

@Injectable()
export class HuggingFaceService {
  private readonly logger = new Logger(HuggingFaceService.name);
  private analysisCache: Map<string, CacheEntry> = new Map();
  private readonly COOLDOWN_TIME = 60 * 1000; // 60 seconds
  private readonly CONFIDENCE_THRESHOLD = 0.65;
  private readonly NORMAL_THRESHOLD = 0.7;
  private hfApiAvailable = true; // Will be set to false if API fails
  private lastHfApiCheck = 0;
  private readonly HF_API_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 mins

  private readonly API_KEY = process.env.HUGGINGFACE_API_KEY || '';
  private readonly API_URL =
    'https://router.huggingface.co/models/facebook/bart-large-mnli';

  async analyzeEvents(projectId: string, eventText: string): Promise<AnalysisResult> {
    // Check cache and cooldown
    const cacheKey = `${projectId}`;
    const cachedResult = this.analysisCache.get(cacheKey);

    if (cachedResult) {
      const timeSinceCached = Date.now() - cachedResult.timestamp;
      if (timeSinceCached < this.COOLDOWN_TIME) {
        this.logger.debug(
          `Returning cached result for ${projectId} (${Math.round(timeSinceCached / 1000)}s old)`,
        );
        return cachedResult.result;
      }
    }

    // Try HuggingFace API if available
    if (this.hfApiAvailable || Date.now() - this.lastHfApiCheck > this.HF_API_CHECK_INTERVAL) {
      try {
        this.logger.debug(`Calling HuggingFace API for ${projectId}`);
        const result = await this.callHuggingFaceAPI(eventText);
        const analysis = this.parseHuggingFaceResponse(result);

        // Cache the result
        this.analysisCache.set(cacheKey, {
          result: analysis,
          timestamp: Date.now(),
        });

        this.logger.debug(
          `HF Analysis complete: ${analysis.category} (confidence: ${analysis.confidence})`,
        );

        return analysis;
      } catch (error) {
        const err = error as Error;
        this.logger.warn(`HuggingFace API error: ${err.message}`);
        this.hfApiAvailable = false;
        this.lastHfApiCheck = Date.now();
        // Fall through to local analysis
      }
    }

    // Fallback to local analysis
    this.logger.debug('Using local fallback analysis');
    const analysis = this.localAnalyzeEvents(eventText);
    
    // Cache the result
    this.analysisCache.set(cacheKey, {
      result: analysis,
      timestamp: Date.now(),
    });

    return analysis;
  }

  /**
   * Test if HuggingFace API is accessible
   */
  async testHuggingFaceConnection(): Promise<{
    success: boolean;
    message: string;
    user?: string;
  }> {
    try {
      // Try inference API endpoint instead of whoami
      const testPayload = {
        inputs: 'test',
        parameters: {
          candidate_labels: ['normal', 'anomaly'],
        },
      };

      const response = await axios.post(this.API_URL, testPayload, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
        },
        timeout: 10000,
      });

      this.hfApiAvailable = true;
      this.logger.log('✓ HuggingFace API connection successful');
      return {
        success: true,
        message: 'HuggingFace API is accessible',
      };
    } catch (error) {
      const err = error as any;
      const errorMsg = err.response?.data?.error || err.message;
      this.logger.error(`✗ HuggingFace API connection failed: ${errorMsg}`);
      this.hfApiAvailable = false;

      // Check if it's an auth issue
      if (err.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed - Invalid or expired token. Using local analysis as fallback.',
        };
      }

      return {
        success: false,
        message: `HuggingFace API error: ${errorMsg}. Using local analysis as fallback.`,
      };
    }
  }

  private async callHuggingFaceAPI(eventText: string): Promise<any> {
    const payload = {
      inputs: eventText,
      parameters: {
        candidate_labels: [
          'normal_activity',
          'security_threat',
          'performance_degradation',
          'service_crash',
          'unauthorized_access',
          'rate_limit_exceeded',
        ],
      },
    };

    try {
      const response = await axios.post(this.API_URL, payload, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      const err = error as any;
      if (err.response?.status === 401) {
        throw new Error('Invalid or expired HuggingFace token');
      }
      throw error;
    }
  }

  private parseHuggingFaceResponse(response: any): AnalysisResult {
    // Response structure: { sequence, labels: [...], scores: [...] }
    const { labels, scores } = response;

    if (!labels || !scores) {
      this.logger.warn('Invalid API response structure. Using fallback analysis.');
      return { ...this.localAnalyzeEvents(''), source: 'fallback' };
    }

    const topLabel = labels[0];
    const topScore = scores[0];

    const isNormal = topLabel === 'normal_activity' && topScore > this.NORMAL_THRESHOLD;
    const isAnomaly = !isNormal && topScore > this.CONFIDENCE_THRESHOLD;

    return {
      isAnomaly,
      category: topLabel,
      confidence: topScore,
      reasoning: `HuggingFace classified as ${topLabel} with ${(topScore * 100).toFixed(1)}% confidence`,
      source: 'hf_api',
    };
  }

  // Robust local analysis
  private localAnalyzeEvents(eventText: string): AnalysisResult {
    const text = eventText.toLowerCase();
    
    // Enhanced keyword detection
    const threatPatterns = {
      security_threat: {
        keywords: ['security', 'breach', 'unauthorized', 'attack', 'exploit', 'injection', 'xss', 'sql'],
        weight: 3,
      },
      service_crash: {
        keywords: ['crash', 'failure', 'fatal', 'panic', 'segfault', 'core dump'],
        weight: 3,
      },
      performance_degradation: {
        keywords: ['timeout', 'slow', 'cpu spike', 'memory leak', 'latency', 'throughput'],
        weight: 2,
      },
      rate_limit_exceeded: {
        keywords: ['rate limit', 'throttle', 'quota', 'concurrent', 'spike'],
        weight: 2,
      },
      unauthorized_access: {
        keywords: ['unauthorized', 'forbidden', '403', '401', 'auth failed', 'permission denied'],
        weight: 3,
      },
    };

    let anomalyScores: { [key: string]: number } = {};

    // Calculate scores for each category
    for (const [category, { keywords, weight }] of Object.entries(threatPatterns)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += weight;
        }
      }
      anomalyScores[category] = score;
    }

    // Find the category with highest score
    let topCategory = 'normal_activity';
    let maxScore = 0;
    for (const [category, score] of Object.entries(anomalyScores)) {
      if (score > maxScore) {
        maxScore = score;
        topCategory = category;
      }
    }

    // Calculate confidence (0-1)
    const confidence = Math.min(maxScore / 5, 1.0);
    const isAnomaly = maxScore >= 2 || confidence > 0.6;

    return {
      isAnomaly,
      category: topCategory,
      confidence,
      reasoning: `Local analysis: ${(confidence * 100).toFixed(0)}% confidence (${maxScore} pattern matches)`,
      source: 'local',
    };
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.analysisCache.size,
      entries: Array.from(this.analysisCache.keys()),
    };
  }

  clearCache(): void {
    this.analysisCache.clear();
    this.logger.debug('Analysis cache cleared');
  }
}
