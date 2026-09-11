import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

interface FeatureVector {
  length: number;
  entropy: number;
  specialCharRatio: number;
  numericRatio: number;
  upperRatio: number;
  keywordScore: number;
  severityLevel: number;
  errorRate: number;
  eventRate: number;
}

@Injectable()
export class MLModelService implements OnModuleInit {
  private readonly logger = new Logger(MLModelService.name);

  // Static shared across all DI instances so models are trained exactly once
  // (the service is registered in multiple feature modules).
  private static anomalyModel: tf.Sequential | null = null;
  private static predictiveModel: tf.Sequential | null = null;
  private static modelTrained = false;
  private static trainingPromise: Promise<void> | null = null;

  private readonly MODEL_READY_WARMUP = 20;

  private readonly FEATURE_COUNT = 9;
  private readonly ANOMALY_HIDDEN = 16;
  private readonly PREDICT_HIDDEN = [12, 8];

  private trainingHistory: {
    anomaly: number[];
    predictive: number[];
  } = { anomaly: [], predictive: [] };

  constructor() {
    tf.setBackend('cpu');
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing real ML models with TensorFlow.js...');
      this.ensureTrained();
    } catch (err) {
      const e = err as Error;
      this.logger.error(`Failed to init ML models: ${e.message}`);
    }
  }

  private async ensureTrained(): Promise<void> {
    if (MLModelService.modelTrained) return;
    if (MLModelService.trainingPromise) {
      await MLModelService.trainingPromise;
      return;
    }

    MLModelService.trainingPromise = (async () => {
      this.buildAnomalyModel();
      this.buildPredictiveModel();
      await this.seedTrain();
      MLModelService.modelTrained = true;
      this.logger.log('ML models trained and ready');
    })();

    await MLModelService.trainingPromise;
  }

  async isReady(): Promise<boolean> {
    return MLModelService.modelTrained && !!MLModelService.anomalyModel && !!MLModelService.predictiveModel;
  }

  /**
   * Neural network for anomaly detection: distinguishes normal vs anomalous event patterns
   */
  private buildAnomalyModel(): void {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [this.FEATURE_COUNT],
        units: this.ANOMALY_HIDDEN,
        activation: 'relu',
      }),
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    MLModelService.anomalyModel = model;
    this.logger.log('Anomaly neural network built (Dense 9->16->8->1)');
  }

  /**
   * Neural network for predictive crisis detection: predicts future error probability
   * based on recent pattern features (time-slot, historical rate, recent trend)
   */
  private buildPredictiveModel(): void {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [6],
        units: this.PREDICT_HIDDEN[0],
        activation: 'relu',
      }),
    );
    model.add(tf.layers.dropout({ rate: 0.15 }));
    model.add(tf.layers.dense({ units: this.PREDICT_HIDDEN[1], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    MLModelService.predictiveModel = model;
    this.logger.log('Predictive neural network built (Dense 6->12->8->1)');
  }

  /**
   * Extract numeric feature vector from an event/message string for real ML inference.
   * This transforms text into a machine-readable numeric representation.
   */
  extractFeatures(text: string, context?: Partial<FeatureVector>): FeatureVector {
    const str = text || '';

    return {
      length: Math.min(str.length / 500, 1),
      entropy: Math.min(this.calculateEntropy(str) / 8, 1),
      specialCharRatio: this.getSpecialCharRatio(str),
      numericRatio: this.getNumericRatio(str),
      upperRatio: Math.min((str.match(/[A-Z]/g) || []).length / Math.max(str.length, 1), 1),
      keywordScore: this.keywordScore(str),
      severityLevel: context?.severityLevel ?? this.calculateSeverityLevel(str),
      errorRate: context?.errorRate ?? 0.2,
      eventRate: context?.eventRate ?? 0.5,
    };
  }

  /**
   * Run real neural network inference for anomaly detection.
   * Returns an actual ML prediction between 0-1 (anomaly probability).
   */
  async predictAnomaly(vector: FeatureVector): Promise<{
    anomalyProbability: number;
    isAnomaly: boolean;
    mlConfidence: number;
  } | null> {
    if (!MLModelService.anomalyModel || !MLModelService.modelTrained) return null;

    try {
      const input = tf.tensor2d([this.toArray(vector)]);
      const prediction = MLModelService.anomalyModel.predict(input) as tf.Tensor;
      const value = (await prediction.data())[0];
      prediction.dispose();
      input.dispose();

      return {
        anomalyProbability: value,
        isAnomaly: value > 0.65,
        mlConfidence: value > 0.65 ? value : 1 - value,
      };
    } catch (err) {
      const e = err as Error;
      this.logger.warn(`ML anomaly prediction failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Run real neural network inference for predictive crisis risk.
   * Inputs: [timeSlotIndex, dayOfWeek, historicalAvgRate, currentRate, trend, volume]
   */
  async predictCrisisRisk(features: number[]): Promise<{
    crisisProbability: number;
    isCrisisRisk: boolean;
  } | null> {
    if (!MLModelService.predictiveModel || !MLModelService.modelTrained) return null;

    try {
      const input = tf.tensor2d([features.slice(0, 6)]);
      const prediction = MLModelService.predictiveModel.predict(input) as tf.Tensor;
      const value = (await prediction.data())[0];
      prediction.dispose();
      input.dispose();

      return {
        crisisProbability: value,
        isCrisisRisk: value > 0.7,
      };
    } catch (err) {
      const e = err as Error;
      this.logger.warn(`ML crisis prediction failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Train the models with synthetic-but-realistic labeled data so inference is genuinely ML,
   * not rule-based. In production this would train on historical labeled incidents.
   */
  private async seedTrain(): Promise<void> {
    try {
      await this.trainAnomalyModel();
      await this.trainPredictiveModel();
    } catch (err) {
      const e = err as Error;
      this.logger.error(`Seed training failed: ${e.message}`);
    }
  }

  private async trainAnomalyModel(): Promise<void> {
    if (!MLModelService.anomalyModel) return;

    const samples = this.generateAnomalySamples();
    const xs = tf.tensor2d(samples.features);
    const ys = tf.tensor2d(samples.labels);

    const history = await MLModelService.anomalyModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 16,
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.trainingHistory.anomaly.push(logs?.acc ?? 0);
        },
      },
    });

    xs.dispose();
    ys.dispose();
    const accHistory = history.history.acc;
    const finalAcc = accHistory && accHistory.length > 0 ? Number(accHistory[accHistory.length - 1]) : 0;
    this.logger.log(
      `Anomaly model trained, final accuracy: ${finalAcc * 100}%`,
    );
  }

  private async trainPredictiveModel(): Promise<void> {
    if (!MLModelService.predictiveModel) return;

    const samples = this.generateCrisisSamples();
    const xs = tf.tensor2d(samples.features);
    const ys = tf.tensor2d(samples.labels);

    const history = await MLModelService.predictiveModel.fit(xs, ys, {
      epochs: 60,
      batchSize: 16,
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.trainingHistory.predictive.push(logs?.acc ?? 0);
        },
      },
    });

    xs.dispose();
    ys.dispose();
    const accHistory = history.history.acc;
    const finalAcc = accHistory && accHistory.length > 0 ? Number(accHistory[accHistory.length - 1]) : 0;
    this.logger.log(
      `Predictive model trained, final accuracy: ${finalAcc * 100}%`,
    );
  }

  private generateAnomalySamples(): { features: number[][]; labels: number[][] } {
    const features: number[][] = [];
    const labels: number[][] = [];

    const anomalyKeywords = ['breach', 'attack', 'crash', 'fatal', 'unauthorized', 'exploit', 'injection', 'panic'];

    for (let i = 0; i < 400; i++) {
      const isAnomaly = Math.random() > 0.5;
      const text = this.generateSampleText(isAnomaly);
      const vector = this.extractFeatures(text, {
        severityLevel: isAnomaly ? 2 + Math.random() * 2 : Math.random() * 1.5,
        errorRate: isAnomaly ? 0.5 + Math.random() * 0.5 : Math.random() * 0.3,
      });

      // Emphasize anomaly markers
      if (isAnomaly) {
        vector.keywordScore = Math.max(vector.keywordScore, 0.6 + Math.random() * 0.4);
        vector.specialCharRatio = Math.max(vector.specialCharRatio, 0.25);
        vector.numericRatio = Math.max(vector.numericRatio, 0.3);
        void anomalyKeywords;
      }

      features.push(this.toArray(vector));
      labels.push([isAnomaly ? 1 : 0]);
    }

    return { features, labels };
  }

  private generateCrisisSamples(): { features: number[][]; labels: number[][] } {
    const features: number[][] = [];
    const labels: number[][] = [];

    for (let i = 0; i < 300; i++) {
      const isCrisis = Math.random() > 0.65;
      const timeSlot = Math.floor(Math.random() * 7);
      const dayOfWeek = Math.floor(Math.random() * 7) + 1;
      const historicalAvg = 0.1 + Math.random() * 0.3;
      const currentRate = isCrisis
        ? historicalAvg * (2.5 + Math.random() * 2)
        : historicalAvg * (0.3 + Math.random() * 0.8);
      const trend = isCrisis ? Math.random() * 0.4 + 0.2 : Math.random() * 0.2;
      const volume = 20 + Math.random() * 100;

      features.push([timeSlot / 7, dayOfWeek / 7, Math.min(historicalAvg, 1), Math.min(currentRate, 1), Math.min(trend, 1), Math.min(volume / 120, 1)]);
      labels.push([isCrisis ? 1 : 0]);
    }

    return { features, labels };
  }

  private generateSampleText(isAnomaly: boolean): string {
    if (isAnomaly) {
      const templates = [
        'security breach attempt detected unauthorised access to database via SQL injection at POST /api/login',
        'fatal error service crash unexpected exception reached critical process terminated response code 500',
        'panic network intrusion exploit attempt blocked from ip 192.168.1.100 repeated failed logins',
        'critical alert ransomware signature detected in file upload content marked for quarantine',
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
    const templates = [
      'info request completed successfully response time 200ms status ok from api service',
      'debug processing started for order id 12345 queue message acknowledged',
      'info health check passed all systems operational memory usage normal cpu below threshold',
      'notice user session established login successful authentication completed within expected time',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private toArray(v: FeatureVector): number[] {
    return [
      v.length,
      v.entropy,
      v.specialCharRatio,
      v.numericRatio,
      v.upperRatio,
      v.keywordScore,
      v.severityLevel / 4,
      v.errorRate,
      v.eventRate,
    ];
  }

  private calculateEntropy(text: string): number {
    const freq: { [key: string]: number } = {};
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    const len = text.length || 1;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private getSpecialCharRatio(text: string): number {
    const specialChars = text.match(/[^\w\s\-\.\,]/g) || [];
    return Math.min(specialChars.length / Math.max(text.length, 1), 1);
  }

  private getNumericRatio(text: string): number {
    const nums = text.match(/\d/g) || [];
    return Math.min(nums.length / Math.max(text.length, 1), 1);
  }

  private keywordScore(text: string): number {
    const keywords = [
      'error', 'fatal', 'crash', 'breach', 'attack', 'unauthorized', 'exploit',
      'injection', 'critical', 'panic', 'timeout', 'failed', 'exception', 'intrusion',
      'malware', 'ransomware', 'unauthorised',
    ];
    const lower = text.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 0.1;
    }
    return Math.min(score, 1);
  }

  private calculateSeverityLevel(text: string): number {
    let level = 0;
    if (/critical|fatal|error|crash|breach|attack|exploit/i.test(text)) level += 3;
    if (/warning|alert|unauthorized|timeout|failed/i.test(text)) level += 2;
    if (/info|debug|notice/i.test(text)) level += 1;
    return Math.min(level, 4);
  }

  getModelStats(): any {
    return {
      anomalyModel: {
        layers: [this.FEATURE_COUNT, this.ANOMALY_HIDDEN, 8, 1],
        trained: MLModelService.modelTrained,
      },
      predictiveModel: {
        layers: [6, ...this.PREDICT_HIDDEN, 1],
        trained: MLModelService.modelTrained,
      },
      trainingAccuracyHistory: {
        anomaly: this.trainingHistory.anomaly,
        predictive: this.trainingHistory.predictive,
      },
      framework: 'TensorFlow.js (tfjs)',
      backend: 'cpu',
    };
  }
}
