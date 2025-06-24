import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StickerImageDocument = StickerImage & Document;

@Schema({ timestamps: true })
export class StickerImage {
  @Prop({ required: true, unique: true })
  stickerImageId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop()
  category?: string;

  @Prop()
  uploadedBy?: string;
}

export const StickerImageSchema = SchemaFactory.createForClass(StickerImage);

// 고유 ID 자동 생성
StickerImageSchema.pre('save', function(next) {
  if (!this.stickerImageId) {
    this.stickerImageId = `sticker_img_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});
