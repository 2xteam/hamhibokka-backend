import { Module, forwardRef } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { StickerImagesModule } from '../sticker-images/sticker-images.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    forwardRef(() => StickerImagesModule),
    JwtModule,
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService], 
})
export class UploadModule {}
