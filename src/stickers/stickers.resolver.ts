import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StickersService } from './stickers.service';
import { Sticker } from './entities/sticker.entity';
import { StickerInput } from './dto/sticker.input';

@Resolver(() => Sticker)
export class StickersResolver {
  constructor(private readonly stickersService: StickersService) {}

  @Query(() => Sticker, { name: 'getSticker' })
  getSticker(@Args('id') id: string) {
    return this.stickersService.findOne(id);
  }

  @Query(() => [Sticker], { name: 'getStickers' })
  getStickers() {
    return this.stickersService.findAll();
  }

  @Mutation(() => Sticker, { name: 'createSticker' })
  createSticker(@Args('input') input: StickerInput) {
    return this.stickersService.create(input);
  }

  @Mutation(() => Sticker, { name: 'updateSticker' })
  updateSticker(@Args('id') id: string, @Args('input') input: StickerInput) {
    return this.stickersService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteSticker' })
  deleteSticker(@Args('id') id: string) {
    return this.stickersService.remove(id);
  }
} 