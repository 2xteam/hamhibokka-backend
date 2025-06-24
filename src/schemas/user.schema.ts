import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  nickname: string;

  @Prop()
  profileImage?: string;

  @Prop()
  fcmToken?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  followApprovalRequired: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 고유 ID 자동 생성을 위한 미들웨어
UserSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});
