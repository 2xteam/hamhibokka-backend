import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StickerImagesModule } from '../sticker-images/sticker-images.module';
import { UsersModule } from '../users/users.module';
import { AzureUploadService } from './azure-upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    forwardRef(() => StickerImagesModule),
    forwardRef(() => UsersModule),
    JwtModule,
  ],
  providers: [AzureUploadService],
  controllers: [UploadController],
  exports: [AzureUploadService],
})
export class UploadModule {}
