import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  // projectId is a free-form string (client id, organizationId, or a literal
  // like 'hospital_001'), not a Mongo ObjectId, so store it as a plain string.
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: false })
  message: string;

  @Prop({ type: Object, required: false })
  details: any;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: 'info' })
  level: 'debug' | 'info' | 'warn' | 'error';

  // incidentId is a uuid() string, not a Mongo ObjectId.
  @Prop({ required: false })
  incidentId?: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
