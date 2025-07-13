import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StickerDocument,
  Sticker as StickerSchema,
} from '../schemas/sticker.schema';
import { StickerInput } from './dto/sticker.input';
import { Sticker } from './entities/sticker.entity';

@Injectable()
export class StickersService {
  constructor(
    @InjectModel(StickerSchema.name)
    private readonly stickerModel: Model<StickerDocument>,
  ) {}

  async create(input: StickerInput, userId: string): Promise<Sticker> {
    const sticker = new this.stickerModel({
      goalId: input.goalId,
      recipientId: input.recipientId,
      stickerImageId: input.stickerImageId,
      createdBy: userId,
      updatedBy: userId,
      // stickerId, grantedBy 등 필요한 필드 추가
    });
    const saved = await sticker.save();
    return {
      id: saved._id ? String(saved._id) : '',
      goalId: saved.goalId,
      recipientId: saved.recipientId,
      stickerImageId: saved.stickerImageId,
    };
  }

  async findAll(): Promise<Sticker[]> {
    const stickers = await this.stickerModel.find();
    return stickers.map((s) => ({
      id: s._id ? s._id.toString() : '',
      goalId: s.goalId,
      recipientId: s.recipientId,
      stickerImageId: s.stickerImageId,
    }));
  }

  async findOne(id: string): Promise<Sticker | undefined> {
    const s = await this.stickerModel.findById(id);
    if (!s) return undefined;
    return {
      id: s._id ? s._id.toString() : '',
      goalId: s.goalId,
      recipientId: s.recipientId,
      stickerImageId: s.stickerImageId,
    };
  }

  async update(
    id: string,
    input: StickerInput,
    userId: string,
  ): Promise<Sticker | undefined> {
    const s = await this.stickerModel.findByIdAndUpdate(
      id,
      {
        goalId: input.goalId,
        recipientId: input.recipientId,
        stickerImageId: input.stickerImageId,
        updatedBy: userId,
      },
      { new: true },
    );
    if (!s) return undefined;
    return {
      id: s._id ? s._id.toString() : '',
      goalId: s.goalId,
      recipientId: s.recipientId,
      stickerImageId: s.stickerImageId,
    };
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const s = await this.stickerModel.findByIdAndUpdate(
      id,
      { updatedBy: userId },
      { new: true },
    );
    if (!s) return false;
    const res = await this.stickerModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
