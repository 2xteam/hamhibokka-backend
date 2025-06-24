import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoalDocument = Goal & Document;

export enum GoalMode {
  PERSONAL = 'personal',
  COMPETITION = 'competition',
  CHALLENGER_RECRUITMENT = 'challenger_recruitment',
}

export enum GoalVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ParticipationRole {
  CREATOR = 'creator',
  PARTICIPANT = 'participant',
}

export enum ParticipationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
}

@Schema()
export class GoalParticipant {
  @Prop({ required: true })
  userId: string;

  @Prop({ enum: ParticipationRole, required: true })
  role: ParticipationRole;

  @Prop({ enum: ParticipationStatus, default: ParticipationStatus.ACTIVE })
  status: ParticipationStatus;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

@Schema({ timestamps: true })
export class Goal {
  @Prop({ required: true, unique: true })
  goalId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  totalStickers: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ enum: GoalMode, required: true })
  mode: GoalMode;

  @Prop({ enum: GoalVisibility, default: GoalVisibility.FOLLOWERS })
  visibility: GoalVisibility;

  @Prop({ enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  maxParticipants?: number;

  @Prop({ default: false })
  autoApprove: boolean;

  @Prop([GoalParticipant])
  participants: GoalParticipant[];
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

// 고유 ID 자동 생성
GoalSchema.pre('save', function(next) {
  if (!this.goalId) {
    this.goalId = `goal_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});
