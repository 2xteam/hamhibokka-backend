import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStickerImageInput } from '../sticker-images/dto/create-sticker-image.input';
import { StickerImagesService } from '../sticker-images/sticker-images.service';
import { UsersService } from '../users/users.service';
import { AzureUploadService } from './azure-upload.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly stickerImagesService: StickerImagesService,
    private readonly azureUploadService: AzureUploadService,
    private readonly usersService: UsersService,
  ) {}

  @Get('my-profile-image')
  @UseGuards(JwtAuthGuard)
  async getMyProfileImage(@CurrentUser() userId: string) {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      return {
        profileImage: user.profileImage || null,
        message: '프로필 이미지 조회 성공',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('프로필 이미지 조회에 실패했습니다.');
    }
  }

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

  @Post('profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    try {
      // Azure에 이미지 업로드
      const uploadResult = await this.azureUploadService.uploadProfileImage(
        file,
        userId,
      );

      // 사용자 프로필 이미지 업데이트
      const updatedUser = await this.usersService.updateProfileImage(
        userId,
        uploadResult.originalUrl,
      );

      if (!updatedUser) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      return {
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        profileImage: uploadResult.originalUrl,
        user: updatedUser,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('프로필 이미지 업로드에 실패했습니다.');
    }
  }
}
