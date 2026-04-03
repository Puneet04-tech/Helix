import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true, unique: true })
  apiKey: string;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'suspended'] })
  status: string;

  @Prop({ type: Array, default: [] })
  monitoredServices: string[];

  @Prop({ type: Object })
  statusSummary: {
    [serviceName: string]: 'operational' | 'degraded' | 'down';
  };

  @Prop({ type: Array, default: [] })
  webhookUrls: string[];

  @Prop({ type: Array, default: [] })
  userIds: string[];

  @Prop({
    type: Object,
    default: {
      enablePredictiveAlerts: true,
      enableAutoResponse: true,
      enablePostmortems: true,
      emailOnCritical: true,
      emailOnWarning: false,
    },
  })
  settings: {
    enablePredictiveAlerts: boolean;
    enableAutoResponse: boolean;
    enablePostmortems: boolean;
    emailOnCritical: boolean;
    emailOnWarning: boolean;
  };

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.index({ organizationId: 1 });
ClientSchema.index({ apiKey: 1 });
ClientSchema.index({ status: 1 });
