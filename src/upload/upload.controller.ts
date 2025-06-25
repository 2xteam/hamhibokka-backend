import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
    UseGuards,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { StickerImagesService } from '../sticker-images/sticker-images.service';
  import { CreateStickerImageInput } from '../sticker-images/dto/create-sticker-image.input';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @Controller('upload')
  export class UploadController {
    constructor(private readonly stickerImagesService: StickerImagesService) {}
  
    @Post('sticker-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadStickerImage(
      @UploadedFile() file: Express.Multer.File,
      @Body() createStickerImageInput: CreateStickerImageInput,
      @CurrentUser() userId: string,
    ) {
      return this.stickerImagesService.uploadStickerImage(
        file,
        createStickerImageInput,
        userId,
      );
    }
  }