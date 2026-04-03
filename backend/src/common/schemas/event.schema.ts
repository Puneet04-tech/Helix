import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  projectId: string;

  @Prop({
    required: true,
    enum: [
      'error',
      'warning',
      'info',
      'security_threat',
      'performance_degradation',
      'unauthorized_access',
      'rate_limit_exceeded',
      'cpu_spike',
      'memory_leak',
      'database_timeout',
      'api_failure',
    ],
  })
  type: string;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  metadata: {
    statusCode?: number;
    endpoint?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    responseTime?: number;
    memoryUsage?: number;
    stackTrace?: string;
    [key: string]: any;
  };

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  processed: boolean;

  @Prop()
  incidentId?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ projectId: 1, timestamp: -1 });
EventSchema.index({ projectId: 1, type: 1, timestamp: -1 });
EventSchema.index({ processed: 1 });
EventSchema.index({ incidentId: 1 });
EventSchema.index({ type: 1 });
