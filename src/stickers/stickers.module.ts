import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StickersService } from './stickers.service';
import { StickersResolver } from './stickers.resolver';
import { Sticker, StickerSchema } from '../schemas/sticker.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sticker.name, schema: StickerSchema }])],
  providers: [StickersResolver, StickersService],
  exports: [StickersService],
})
export class StickersModule {} 