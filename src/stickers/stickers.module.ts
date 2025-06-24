import { Module } from '@nestjs/common';
import { StickersResolver } from './stickers.resolver';
import { StickersService } from './stickers.service';

@Module({
  providers: [StickersResolver, StickersService],
})
export class StickersModule {} 