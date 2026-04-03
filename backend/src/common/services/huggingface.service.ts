import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OllamaService } from './ollama.service';

interface AnalysisResult {
  isAnomaly: boolean;
  category: string;
  confidence: number;
  reasoning: string;
  source: 'ollama' | 'hf_api' | 'statistical' | 'behavioral' | 'pattern' | 'fallback';
  details?: {
    scores?: { [key: string]: number };
    signals?: string[];
  };
}

interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
}

interface EventBaseline {
  avgLength: number;
  avgSeverityLevel: number;
  categoryDistribution: { [key: string]: number };
  lastUpdated: number;
}

@Injectable()
export class HuggingFaceService {
  private readonly logger = new Logger(HuggingFaceService.name);
  private analysisCache: Map<string, CacheEntry> = new Map();
  private eventBaselines: Map<string, EventBaseline> = new Map();
  
  private readonly COOLDOWN_TIME = 60 * 1000;
  private readonly CONFIDENCE_THRESHOLD = 0.65;
  private readonly NORMAL_THRESHOLD = 0.7;
  
  private hfApiAvailable = true;
  private lastHfApiCheck = 0;
  private readonly HF_API_CHECK_INTERVAL = 5 * 60 * 1000;

  private readonly API_KEY = process.env.HUGGINGFACE_API_KEY || '';
  private readonly API_URL =
    'https://router.huggingface.co/models/facebook/bart-large-mnli';

  constructor(private readonly ollamaService: OllamaService) {}

  async analyzeEvents(projectId: string, eventText: string): Promise<AnalysisResult> {
    // Check cache
    const cacheKey = `${projectId}`;
    const cachedResult = this.analysisCache.get(cacheKey);

    if (cachedResult) {
      const timeSinceCached = Date.now() - cachedResult.timestamp;
      if (timeSinceCached < this.COOLDOWN_TIME) {
        this.logger.debug(`Returning cached result for ${projectId}`);
        return cachedResult.result;
      }
    }

    // Update baseline with this event
    this.updateBaseline(projectId, eventText);

    // Try analysis chain: Ollama → HF API → Statistical → Behavioral → Pattern → Fallback
    let result: AnalysisResult | null = null;

    // Tier 0: Ollama (Local LLM - BEST if available)
    result = await this.ollamaService.analyzeWithOllama(eventText);
    if (result) {
      this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    // Tier 1: HuggingFace API
    if (this.hfApiAvailable || Date.now() - this.lastHfApiCheck > this.HF_API_CHECK_INTERVAL) {
      result = await this.tryHuggingFaceAnalysis(eventText);
      if (result) {
        this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }
    }

    // Tier 2: Statistical Analysis (more reliable than pattern matching)
    result = this.statisticalAnalysis(projectId, eventText);
    if (result.confidence > 0.7) {
      this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    // Tier 3: Behavioral Analysis (detect anomalies vs baseline)
    const behavioralResult = this.behavioralAnalysis(projectId, eventText);
    if (behavioralResult.confidence > 0.7) {
      this.analysisCache.set(cacheKey, { result: behavioralResult, timestamp: Date.now() });
      return behavioralResult;
    }

    // Tier 4: Enhanced Pattern Matching (with context)
    const patternResult = this.enhancedPatternAnalysis(eventText);
    if (patternResult.confidence > 0.6) {
      this.analysisCache.set(cacheKey, { result: patternResult, timestamp: Date.now() });
      return patternResult;
    }

    // Tier 5: Fallback - Conservative approach
    const fallbackResult = this.fallbackAnalysis(eventText);
    this.analysisCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() });
    return fallbackResult;
  }

  /**
   * Tier 1: HuggingFace API Analysis
   */
  private async tryHuggingFaceAnalysis(eventText: string): Promise<AnalysisResult | null> {
    try {
      this.logger.debug('Trying HuggingFace API');
      const result = await this.callHuggingFaceAPI(eventText);
      const analysis = this.parseHuggingFaceResponse(result);
      this.hfApiAvailable = true;
      return analysis;
    } catch (error) {
      const err = error as any;
      this.logger.warn(`HF API failed: ${err.message}`);
      this.hfApiAvailable = false;
      this.lastHfApiCheck = Date.now();
      return null;
    }
  }

  /**
   * Tier 2: Statistical Analysis (entropy, anomaly scoring)
   */
  private statisticalAnalysis(projectId: string, eventText: string): AnalysisResult {
    const scores: { [key: string]: number } = {};
    const signals: string[] = [];

    // Signal 1: Message length anomaly
    const avgLen = this.eventBaselines.get(projectId)?.avgLength || 100;
    const lengthDeviation = Math.abs(eventText.length - avgLen) / avgLen;
    if (lengthDeviation > 2) {
      scores['length_anomaly'] = Math.min(lengthDeviation / 5, 1.0);
      signals.push(`Length deviation: ${(lengthDeviation * 100).toFixed(0)}%`);
    }

    // Signal 2: Entropy/randomness (high entropy = suspicious)
    const entropy = this.calculateEntropy(eventText);
    if (entropy > 5.5) {
      scores['high_entropy'] = Math.min((entropy - 5.5) / 2, 1.0);
      signals.push(`High entropy: ${entropy.toFixed(2)}`);
    }

    // Signal 3: Special character density (SQL injection, command injection)
    const specialCharRatio = this.getSpecialCharRatio(eventText);
    if (specialCharRatio > 0.15) {
      scores['special_char_density'] = specialCharRatio;
      signals.push(`Special chars: ${(specialCharRatio * 100).toFixed(1)}%`);
    }

    // Signal 4: Numeric spike (timestamps, IDs, ports)
    const numericRatio = this.getNumericRatio(eventText);
    if (numericRatio > 0.4) {
      scores['numeric_spike'] = numericRatio;
      signals.push(`Numeric spike: ${(numericRatio * 100).toFixed(1)}%`);
    }

    const avgScore = signals.length > 0 
      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length 
      : 0;

    const isAnomaly = avgScore > this.CONFIDENCE_THRESHOLD;
    const category = this.determineCategoryFromSignals(signals);

    return {
      isAnomaly,
      category,
      confidence: avgScore,
      reasoning: signals.length > 0 
        ? `Statistical anomaly detected: ${signals.join(', ')}`
        : 'Statistical analysis normal',
      source: 'statistical',
      details: { scores, signals },
    };
  }

  /**
   * Tier 3: Behavioral Analysis (deviation from baseline)
   */
  private behavioralAnalysis(projectId: string, eventText: string): AnalysisResult {
    const baseline = this.eventBaselines.get(projectId);
    if (!baseline) {
      return {
        isAnomaly: false,
        category: 'normal_activity',
        confidence: 0,
        reasoning: 'No baseline yet',
        source: 'behavioral',
      };
    }

    const signals: string[] = [];
    const scores: { [key: string]: number } = {};

    // Check category distribution anomaly
    const textLower = eventText.toLowerCase();
    const detectedCategory = this.detectCategory(textLower);
    const categoryFreq = baseline.categoryDistribution[detectedCategory] || 0;
    
    if (categoryFreq < 0.1) {
      scores['rare_category'] = 0.7;
      signals.push(`Rare category: ${detectedCategory}`);
    }

    // Check severity level deviation
    const severityLevel = this.calculateSeverityLevel(eventText);
    const severityDeviation = Math.abs(severityLevel - baseline.avgSeverityLevel) / 
                             (baseline.avgSeverityLevel || 1);
    
    if (severityDeviation > 1.5) {
      scores['severity_spike'] = Math.min(severityDeviation / 3, 1.0);
      signals.push(`Severity spike: ${(severityDeviation * 100).toFixed(0)}%`);
    }

    const avgScore = signals.length > 0
      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
      : 0;

    return {
      isAnomaly: avgScore > this.CONFIDENCE_THRESHOLD,
      category: detectedCategory,
      confidence: avgScore,
      reasoning: signals.length > 0 
        ? `Behavioral anomaly: ${signals.join(', ')}`
        : 'Behavior is normal',
      source: 'behavioral',
      details: { scores, signals },
    };
  }

  /**
   * Tier 4: Enhanced Pattern Analysis (smarter than basic keyword matching)
   */
  private enhancedPatternAnalysis(eventText: string): AnalysisResult {
    const text = eventText.toLowerCase();
    const signals: string[] = [];
    const scores: { [key: string]: number } = {};

    // Pattern 1: SQL/Command Injection patterns
    const injectionPatterns = [
      /(\bor\b\s*1\s*=\s*1|\bor\b\s*'1'\s*=\s*'1|union.*select|;<|>|\$\{|\$\(|\`|--|\#.*\n)/gi,
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(text)) {
        scores['injection_risk'] = 0.9;
        signals.push('Potential injection detected');
        break;
      }
    }

    // Pattern 2: Credential/Sensitive data patterns
    if (/(password|secret|api[_\-]?key|token|credential|private[_\-]?key)\s*[:=]/i.test(text)) {
      scores['sensitive_data'] = 0.8;
      signals.push('Sensitive data exposure detected');
    }

    // Pattern 3: Error patterns (indicates failure/crash)
    if (/(exception|error|fatal|crash|failed|timeout|segfault|panic)/i.test(text)) {
      scores['error_detected'] = 0.7;
      signals.push('Error/crash pattern detected');
    }

    // Pattern 4: Authorization/Security patterns
    if (/(unauthorized|forbidden|401|403|access[_\-]?denied|permission[_\-]?denied)/i.test(text)) {
      scores['auth_issue'] = 0.75;
      signals.push('Authentication/authorization issue');
    }

    const avgScore = signals.length > 0
      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
      : 0;

    const category = this.determineCategoryFromSignals(signals);

    return {
      isAnomaly: avgScore > 0.6,
      category,
      confidence: avgScore,
      reasoning: signals.length > 0 
        ? `Pattern match: ${signals.join(', ')}`
        : 'Pattern analysis normal',
      source: 'pattern',
      details: { scores, signals },
    };
  }

  /**
   * Tier 5: Conservative Fallback
   */
  private fallbackAnalysis(eventText: string): AnalysisResult {
    const text = eventText.toLowerCase();
    const hasWarning = /alert|critical|severe|urgent/i.test(text);
    
    return {
      isAnomaly: hasWarning,
      category: 'normal_activity',
      confidence: hasWarning ? 0.5 : 0.1,
      reasoning: hasWarning 
        ? 'Conservative: Alert keywords detected, escalating for review'
        : 'No indicators detected, treating as normal',
      source: 'fallback',
    };
  }

  /**
   * Utility Methods
   */

  private calculateEntropy(text: string): number {
    const freq: { [key: string]: number } = {};
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = text.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private getSpecialCharRatio(text: string): number {
    const specialChars = text.match(/[^\w\s\-\.\,]/g) || [];
    return specialChars.length / text.length;
  }

  private getNumericRatio(text: string): number {
    const nums = text.match(/\d/g) || [];
    return nums.length / text.length;
  }

  private calculateSeverityLevel(text: string): number {
    let level = 0;
    if (/critical|fatal|error|crash/i.test(text)) level += 3;
    if (/warning|alert/i.test(text)) level += 2;
    if (/info|debug/i.test(text)) level += 1;
    return level;
  }

  private detectCategory(text: string): string {
    if (/(security|breach|unauthorized|attack|exploit|injection)/i.test(text))
      return 'security_threat';
    if (/(crash|failure|fatal|panic|segfault)/i.test(text))
      return 'service_crash';
    if (/(timeout|slow|cpu|memory|latency|throughput|spike)/i.test(text))
      return 'performance_degradation';
    if (/(rate[_\-]?limit|throttle|quota|concurrent)/i.test(text))
      return 'rate_limit_exceeded';
    if (/(unauthorized|forbidden|401|403|permission)/i.test(text))
      return 'unauthorized_access';
    return 'normal_activity';
  }

  private determineCategoryFromSignals(signals: string[]): string {
    const allSignals = signals.join(' ').toLowerCase();
    return this.detectCategory(allSignals);
  }

  private updateBaseline(projectId: string, eventText: string): void {
    const baseline = this.eventBaselines.get(projectId) || {
      avgLength: 100,
      avgSeverityLevel: 1,
      categoryDistribution: {},
      lastUpdated: Date.now(),
    };

    // Update length (moving average)
    baseline.avgLength = (baseline.avgLength * 0.8) + (eventText.length * 0.2);

    // Update severity
    baseline.avgSeverityLevel = 
      (baseline.avgSeverityLevel * 0.8) + (this.calculateSeverityLevel(eventText) * 0.2);

    // Update category distribution
    const category = this.detectCategory(eventText.toLowerCase());
    const total = Object.values(baseline.categoryDistribution).reduce((a, b) => a + b, 0) + 1;
    for (const cat in baseline.categoryDistribution) {
      baseline.categoryDistribution[cat] /= total;
    }
    baseline.categoryDistribution[category] = 
      ((baseline.categoryDistribution[category] || 0) * total + 1) / (total + 1);

    baseline.lastUpdated = Date.now();
    this.eventBaselines.set(projectId, baseline);
  }

  async testHuggingFaceConnection(): Promise<{
    success: boolean;
    message: string;
    user?: string;
  }> {
    try {
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

      if (err.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication failed - Invalid or expired token. Using intelligent fallback.',
        };
      }

      return {
        success: false,
        message: `HuggingFace API error: ${errorMsg}. Using intelligent fallback.`,
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
    const { labels, scores } = response;

    if (!labels || !scores) {
      this.logger.warn('Invalid API response structure');
      return this.fallbackAnalysis('');
    }

    const topLabel = labels[0];
    const topScore = scores[0];

    const isNormal = topLabel === 'normal_activity' && topScore > this.NORMAL_THRESHOLD;
    const isAnomaly = !isNormal && topScore > this.CONFIDENCE_THRESHOLD;

    return {
      isAnomaly,
      category: topLabel,
      confidence: topScore,
      reasoning: `HuggingFace ML: ${(topScore * 100).toFixed(1)}% confidence for ${topLabel}`,
      source: 'hf_api',
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
