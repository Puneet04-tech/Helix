import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
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

  @Prop({ type: Types.ObjectId, ref: 'Incident', required: false })
  incidentId?: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
