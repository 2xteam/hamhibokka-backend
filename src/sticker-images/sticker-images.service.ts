import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StickerImage,
  StickerImageDocument,
} from '../schemas/sticker-image.schema';
import { AzureUploadService } from '../upload/azure-upload.service';
import { CreateStickerImageInput } from './dto/create-sticker-image.input';

@Injectable()
export class StickerImagesService {
  constructor(
    @InjectModel(StickerImage.name)
    private stickerImageModel: Model<StickerImageDocument>,
    private uploadService: AzureUploadService,
  ) {}

  /**
   * 커스텀 스티커 이미지 업로드
   */
  async uploadStickerImage(
    file: Express.Multer.File,
    createStickerImageInput: CreateStickerImageInput,
    userId: string,
  ) {
    // Azure Blob Storage에 이미지 업로드
    const uploadResult = await this.uploadService.uploadStickerImage(
      file,
      userId,
    );

    // stickerImageId 명시적 생성
    const stickerImageId = `sticker_img_${Math.random().toString(36).substr(2, 9)}`;

    // DB에 스티커 이미지 정보 저장
    const stickerImage = new this.stickerImageModel({
      stickerImageId,
      name: createStickerImageInput.name,
      imageUrl: uploadResult.originalUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      category: createStickerImageInput.category,
      uploadedBy: userId,
      isDefault: false,
    });

    const savedStickerImage = await stickerImage.save();

    return {
      id: savedStickerImage._id && savedStickerImage._id.toString(),
      stickerImageId: savedStickerImage.stickerImageId,
      name: savedStickerImage.name,
      imageUrl: savedStickerImage.imageUrl,
      thumbnailUrl: savedStickerImage.thumbnailUrl,
      isDefault: savedStickerImage.isDefault,
      category: savedStickerImage.category,
      uploadedBy: savedStickerImage.uploadedBy,
      createdAt: savedStickerImage.createdAt,
    };
  }

  /**
   * 사용자별 스티커 이미지 목록 조회
   */
  async findUserStickerImages(userId: string) {
    const stickerImages = await this.stickerImageModel
      .find({
        $or: [{ uploadedBy: userId }, { isDefault: true }],
      })
      .sort({ createdAt: -1 });

    return stickerImages.map((image) => ({
      id: image._id && image._id.toString(),
      stickerImageId: image.stickerImageId,
      name: image.name,
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl,
      isDefault: image.isDefault,
      category: image.category,
      uploadedBy: image.uploadedBy,
      createdAt: image.createdAt,
    }));
  }

  /**
   * 기본 스티커 이미지 목록 조회
   */
  async findDefaultStickerImages() {
    const stickerImages = await this.stickerImageModel
      .find({ isDefault: true })
      .sort({ category: 1, name: 1 });

    return stickerImages.map((image) => ({
      id: image._id && image._id.toString(),
      stickerImageId: image.stickerImageId,
      name: image.name,
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl,
      isDefault: image.isDefault,
      category: image.category,
      uploadedBy: image.uploadedBy,
      createdAt: image.createdAt,
    }));
  }

  /**
   * 스티커 이미지 삭제
   */
  async deleteStickerImage(stickerImageId: string, userId: string) {
    const stickerImage = await this.stickerImageModel.findOne({
      stickerImageId,
    });

    if (!stickerImage) {
      throw new NotFoundException('스티커 이미지를 찾을 수 없습니다.');
    }

    // 기본 스티커는 삭제할 수 없음
    if (stickerImage.isDefault) {
      throw new UnauthorizedException('기본 스티커는 삭제할 수 없습니다.');
    }

    // 본인이 업로드한 스티커만 삭제 가능
    if (stickerImage.uploadedBy !== userId) {
      throw new UnauthorizedException(
        '본인이 업로드한 스티커만 삭제할 수 있습니다.',
      );
    }

    // Azure Blob Storage에서 파일 삭제
    const fileKey = stickerImage.imageUrl.split('/').slice(-3).join('/');
    const thumbnailKey = stickerImage.thumbnailUrl
      .split('/')
      .slice(-4)
      .join('/');

    await this.uploadService.deleteFile(fileKey);
    await this.uploadService.deleteFile(thumbnailKey);

    // DB에서 삭제
    await this.stickerImageModel.deleteOne({ stickerImageId });

    return true;
  }
}
