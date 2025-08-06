import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FollowDocument = Follow & Document;

export enum FollowStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  BLOCKED = 'blocked',
  MUTUAL = 'mutual',
}

@Schema({ timestamps: true })
export class Follow {
  @Prop({ required: true })
  followerId: string;

  @Prop({ required: true })
  followingId: string;

  @Prop({ enum: FollowStatus, default: FollowStatus.PENDING })
  status: FollowStatus;

  @Prop()
  approvedAt?: Date;

  @Prop({ required: false })
  createdBy?: string;

  @Prop({ required: false })
  updatedBy?: string;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// 중복 팔로우 방지를 위한 복합 인덱스
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
