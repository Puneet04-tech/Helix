import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as tf from '@tensorflow/tfjs';
import { Event, EventDocument } from '../schemas/event.schema';
import { MLModelService } from './ml-model.service';

interface MLAnomalyResult {
  anomalyProbability: number;
  isAnomaly: boolean;
  featureContributions: { [key: string]: number };
  model: string;
}

@Injectable()
export class MLAnomalyService {
  private readonly logger = new Logger(MLAnomalyService.name);

  constructor(
    private readonly mlModelService: MLModelService,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  /**
   * Run real TensorFlow.js ML anomaly detection on an event stream.
   */
  async detectAnomalyML(eventText: string, projectId?: string): Promise<MLAnomalyResult | null> {
    const vector = this.mlModelService.extractFeatures(eventText, {
      severityLevel: undefined,
      errorRate: undefined,
      eventRate: undefined,
    });

    const prediction = await this.mlModelService.predictAnomaly(vector);
    if (!prediction) return null;

    // Compute per-feature contribution for interpretable ML
    const contributions: { [key: string]: number } = {
      keyword_signal: vector.keywordScore,
      severity_signal: vector.severityLevel / 4,
      entropy_signal: vector.entropy,
      length_signal: vector.length,
      special_char_signal: vector.specialCharRatio,
      numeric_signal: vector.numericRatio,
    };

    return {
      anomalyProbability: prediction.anomalyProbability,
      isAnomaly: prediction.isAnomaly,
      featureContributions: contributions,
      model: 'tensorflow-js-dense-classifier',
    };
  }

  /**
   * Score a single event message for anomaly using the ML model.
   * Returns null if model not ready (caller falls back to statistical/heuristic).
   */
  async scoreEvent(eventText: string): Promise<{ score: number; isAnomaly: boolean } | null> {
    const prediction = await this.mlModelService.predictAnomaly(
      this.mlModelService.extractFeatures(eventText),
    );
    if (!prediction) return null;
    return { score: prediction.anomalyProbability, isAnomaly: prediction.isAnomaly };
  }

  getMLStatus(): any {
    return {
      ready: this.mlModelService.isReady(),
      modelStats: this.mlModelService.getModelStats(),
    };
  }
}
