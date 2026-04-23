import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidentDocument = Incident & Document;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  incidentId: string;

  @Prop({
    required: true,
    enum: ['critical', 'warning', 'info'],
  })
  severity: string;

  @Prop({
    required: true,
    enum: [
      'medical_incident',
      'equipment_failure',
      'patient_incident',
      'system_incident',
      'guest_complaint',
      'security_threat',
      'performance_degradation',
      'unauthorized_access',
      'rate_limit_exceeded',
      'cpu_spike',
      'memory_leak',
      'database_timeout',
      'api_failure',
      'incident_detected',
      'error',
      'warning',
      'info',
    ],
  })
  type: string;

  @Prop({ required: true })
  service: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'detecting' })
  status: string; // detecting, analyzing, responding, resolved

  @Prop({ type: Array })
  affectedServices: string[];

  @Prop({ type: Array })
  affectedEndpoints: string[];

  @Prop()
  impactSummary: string;

  @Prop({ type: Array, default: [] })
  eventIds: string[];

  @Prop({ type: Object })
  agentReasoning: {
    detectionAgent?: {
      analysis: string;
      confidence: number;
      timestamp: Date;
    };
    analysisAgent?: {
      rootCause: string;
      affectedSystems: string[];
      estimatedImpact: string;
      timestamp: Date;
    };
    responseAgent?: {
      actions: Array<{ 
        action: string; 
        target: string; 
        result: string;
        success: boolean;
      }>;
      timestamp: Date;
    };
    commsAgent?: {
      notifications: Array<{ recipient: string; channel: string; status: string }>;
      timestamp: Date;
    };
  };

  @Prop({ type: Object })
  automaticActions: Array<{
    action: string;
    target: string;
    result: string;
    timestamp: Date;
  }>;

  // Feature 1: DNA Fingerprinting
  @Prop({ type: Object })
  fingerprint: {
    signature: string; // Hashed/Stringified pattern of event types & timing
    eventSequence: string[]; // Sequential list of event types
    timingGaps: number[]; // MS between events
    matchScore?: number;
    matchedIncidentId?: string;
    rootCauseReference?: string;
  };

  // Feature 3: Guest Impact Score
  @Prop({ type: Object })
  businessImpact: {
    guestImpactScore: number;
    estimatedRevenueAtRisk: number;
    affectedGuestCount: number;
    conversionLossCount: number;
    experienceScore: number; // 0-100 degradation
  };

  // Feature 8: Support Ticket Sentiment
  @Prop({ type: Object })
  sentimentAnalysis: {
    score: number; // -1 to 1
    label: string; // 'negative', 'neutral', 'positive'
    emotionalTone: string; // 'angry', 'distressed', 'urgent', 'happy'
    highlightedQuotes: string[];
  };

  @Prop()
  resolutionTime: number; // in milliseconds

  @Prop({ type: Array })
  actions: Array<{
    action: string;
    target: string;
    result: string;
    executedAt: Date;
    success: boolean;
  }>;

  @Prop()
  correlationNote?: string;

  @Prop()
  postmortemUrl?: string;

  @Prop()
  postmortemPath?: string;

  @Prop({ type: Date })
  postmortemGeneratedAt?: Date;

  @Prop()
  postmortemContent?: string;

  @Prop({ type: Object })
  metadata?: {
    sourceIp?: string;
    originIp?: string;
    location?: string;
    room?: string;
    [key: string]: any;
  };

  @Prop({ default: false })
  isCorrelated?: boolean;

  @Prop({ type: [String], default: [] })
  correlatedIncidentIds?: string[];

  @Prop()
  rootCause?: string;

  @Prop({ default: 0 })
  affectedUsers?: number;

  @Prop({ type: Date })
  detectedAt: Date;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: [String], default: [] })
  notifiedUsers: string[];
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
IncidentSchema.index({ projectId: 1, createdAt: -1 });
IncidentSchema.index({ projectId: 1, status: 1 });
IncidentSchema.index({ projectId: 1, severity: 1 });
IncidentSchema.index({ incidentId: 1 });
IncidentSchema.index({ type: 1 });
