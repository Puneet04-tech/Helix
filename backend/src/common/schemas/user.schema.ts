import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // hashed

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  role: string; // 'developer', 'manager', 'owner'

  @Prop({ type: Array, default: [] })
  projectIds: string[];

  @Prop({ type: Object, default: { email: true, slack: false, sms: false } })
  preferences: {
    email: boolean;
    slack: boolean;
    sms: boolean;
  };

  @Prop({ type: Object, default: { critical: true, warning: true, info: false } })
  alertPreferences: {
    critical: boolean;
    warning: boolean;
    info: boolean;
  };

  @Prop()
  slackUserId?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ organizationId: 1 });
UserSchema.index({ projectIds: 1 });
