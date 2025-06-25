import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StickerImagesService } from './sticker-images.service';
import { StickerImagesResolver } from './sticker-images.resolver';
import { StickerImage, StickerImageSchema } from '../schemas/sticker-image.schema';
import { UploadModule } from '../upload/upload.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StickerImage.name, schema: StickerImageSchema }
    ]),
    forwardRef(() => UploadModule),
    JwtModule,
  ],
  providers: [StickerImagesResolver, StickerImagesService],
  exports: [StickerImagesService],
})
export class StickerImagesModule {}