import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StickerImagesService } from './sticker-images.service';
import { StickerImage } from './entities/sticker-image.entity';
import { CreateStickerImageInput } from './dto/create-sticker-image.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => StickerImage)
export class StickerImagesResolver {
  constructor(private readonly stickerImagesService: StickerImagesService) {}

  @Query(() => [StickerImage], { name: 'myStickerImages' })
  @UseGuards(JwtAuthGuard)
  findUserStickerImages(@CurrentUser() userId: string) {
    return this.stickerImagesService.findUserStickerImages(userId);
  }

  @Query(() => [StickerImage], { name: 'defaultStickerImages' })
  findDefaultStickerImages() {
    return this.stickerImagesService.findDefaultStickerImages();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteStickerImage(
    @Args('stickerImageId') stickerImageId: string,
    @CurrentUser() userId: string,
  ) {
    return this.stickerImagesService.deleteStickerImage(stickerImageId, userId);
  }
}