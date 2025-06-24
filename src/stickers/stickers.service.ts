import { Injectable } from '@nestjs/common';
import { StickerInput } from './dto/sticker.input';
import { Sticker } from './entities/sticker.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StickersService {
  private stickers: Sticker[] = [];

  create(input: StickerInput): Sticker {
    const sticker: Sticker = {
      id: uuidv4(),
      goalId: input.goalId,
      recipientId: input.recipientId,
      stickerImageId: input.stickerImageId,
    };
    this.stickers.push(sticker);
    return sticker;
  }

  findAll(): Sticker[] {
    return this.stickers;
  }

  findOne(id: string): Sticker | undefined {
    return this.stickers.find(s => s.id === id);
  }

  update(id: string, input: StickerInput): Sticker | undefined {
    const sticker = this.findOne(id);
    if (sticker) {
      sticker.goalId = input.goalId;
      sticker.recipientId = input.recipientId;
      sticker.stickerImageId = input.stickerImageId;
    }
    return sticker;
  }

  remove(id: string): boolean {
    const idx = this.stickers.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.stickers.splice(idx, 1);
      return true;
    }
    return false;
  }
} 