import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StickerInput } from './dto/sticker.input';
import { Sticker } from './entities/sticker.entity';
import { StickersService } from './stickers.service';

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
  @UseGuards(JwtAuthGuard)
  async createSticker(
    @Args('input') input: StickerInput,
    @CurrentUser() userId: string,
  ) {
    return this.stickersService.create(input, userId);
  }

  @Mutation(() => Sticker, { name: 'updateSticker' })
  @UseGuards(JwtAuthGuard)
  async updateSticker(
    @Args('id') id: string,
    @Args('input') input: StickerInput,
    @CurrentUser() userId: string,
  ) {
    return this.stickersService.update(id, input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteSticker' })
  @UseGuards(JwtAuthGuard)
  async deleteSticker(@Args('id') id: string, @CurrentUser() userId: string) {
    return this.stickersService.remove(id, userId);
  }
}
