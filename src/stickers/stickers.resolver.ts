import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StickersService } from './stickers.service';
import { Sticker } from './entities/sticker.entity';
import { StickerInput } from './dto/sticker.input';

@Resolver(() => Sticker)
export class StickersResolver {
  constructor(private readonly stickersService: StickersService) {}

  @Query(() => [Sticker], { name: 'getStickers' })
  async getStickers() {
    return this.stickersService.findAll();
  }

  @Query(() => Sticker, { name: 'getSticker', nullable: true })
  async getSticker(@Args('id') id: string) {
    return this.stickersService.findOne(id);
  }

  @Mutation(() => Sticker, { name: 'createSticker' })
  async createSticker(@Args('input') input: StickerInput) {
    return this.stickersService.create(input);
  }

  @Mutation(() => Sticker, { name: 'updateSticker' })
  async updateSticker(@Args('id') id: string, @Args('input') input: StickerInput) {
    return this.stickersService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteSticker' })
  async deleteSticker(@Args('id') id: string) {
    return this.stickersService.remove(id);
  }
} 