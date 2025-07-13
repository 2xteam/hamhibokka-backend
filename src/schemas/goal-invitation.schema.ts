import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoalInvitationDocument = GoalInvitation & Document;

export enum InvitationType {
  INVITE = 'invite', // Goal 생성자가 초대
  REQUEST = 'request', // 사용자가 참가 요청
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class GoalInvitation {
  @Prop({ unique: true })
  invitationId?: string;

  @Prop({ required: true })
  goalId: string;

  @Prop({ required: true })
  fromUserId: string; // 초대/요청을 보낸 사용자

  @Prop({ required: true })
  toUserId: string; // 초대/요청을 받은 사용자

  @Prop({ enum: InvitationType, required: true })
  type: InvitationType;

  @Prop({ enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop()
  message?: string; // 초대/요청 메시지

  @Prop()
  respondedAt?: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  updatedBy?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GoalInvitationSchema =
  SchemaFactory.createForClass(GoalInvitation);

// 고유 ID 자동 생성
GoalInvitationSchema.pre('save', function (next) {
  if (!this.invitationId) {
    this.invitationId = `invitation_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// 새로운 문서 생성 시 invitationId 자동 설정
GoalInvitationSchema.pre('validate', function (next) {
  if (!this.invitationId) {
    this.invitationId = `invitation_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});
