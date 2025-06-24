import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StickerDocument = Sticker & Document;

export enum StickerStatus {
  EARNED = 'earned',
  REQUESTED = 'requested',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Sticker {
  @Prop({ required: true, unique: true })
  stickerId: string;

  @Prop({ required: true })
  goalId: string;

  @Prop({ required: true })
  recipientId: string;

  @Prop({ required: true })
  grantedBy: string;

  @Prop({ required: true })
  stickerImageId: string;

  @Prop()
  reason?: string;

  @Prop({ enum: StickerStatus, default: StickerStatus.EARNED })
  status: StickerStatus;

  @Prop()
  requestedAt?: Date;

  @Prop({ default: Date.now })
  grantedAt: Date;
}

export const StickerSchema = SchemaFactory.createForClass(Sticker);

// 고유 ID 자동 생성
StickerSchema.pre('save', function(next) {
  if (!this.stickerId) {
    this.stickerId = `sticker_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});
