import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    // S3 클라이언트 초기화
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Required AWS configuration is missing');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    this.bucketName = bucketName;
  }

  /**
   * 스티커 이미지 업로드
   * @param file - 업로드할 파일
   * @param userId - 업로드하는 사용자 ID
   * @returns 업로드된 이미지 정보
   */
  async uploadStickerImage(file: Express.Multer.File, userId: string) {
    try {
      // 파일 유효성 검사
      this.validateImageFile(file);

      // 고유한 파일명 생성
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `stickers/${userId}/${uuidv4()}.${fileExtension}`;
      const thumbnailFileName = `stickers/${userId}/thumbnails/${uuidv4()}.${fileExtension}`;

      // 이미지 리사이징 (원본: 최대 1024px, 썸네일: 256px)
      const [optimizedImage, thumbnailImage] = await Promise.all([
        this.resizeImage(file.buffer, 1024),
        this.resizeImage(file.buffer, 256),
      ]);

      // S3에 원본과 썸네일 동시 업로드
      const [originalUpload, thumbnailUpload] = await Promise.all([
        this.uploadToS3(fileName, optimizedImage, file.mimetype),
        this.uploadToS3(thumbnailFileName, thumbnailImage, file.mimetype),
      ]);

      return {
        originalUrl: this.getPublicUrl(fileName),
        thumbnailUrl: this.getPublicUrl(thumbnailFileName),
        fileName,
        thumbnailFileName,
        size: optimizedImage.length,
      };
    } catch (error) {
      throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
    }
  }

  /**
   * 이미지 파일 유효성 검사
   */
  private validateImageFile(file: Express.Multer.File) {
    // 파일 크기 체크 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    // 파일 형식 체크
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)');
    }
  }

  /**
   * 이미지 리사이징
   */
  private async resizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
    return sharp(buffer)
      .resize(maxWidth, maxWidth, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  /**
   * S3에 파일 업로드
   */
  private async uploadToS3(key: string, buffer: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // 1년 캐시
    });

    return this.s3Client.send(command);
  }

  /**
   * 파일의 공개 URL 생성
   */
  private getPublicUrl(key: string): string {
    const cloudFrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
    
    if (cloudFrontDomain) {
      return `${cloudFrontDomain}/${key}`;
    }
    
    return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
  }

  /**
   * S3에서 파일 삭제
   */
  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 여러 파일 동시 삭제
   */
  async deleteFiles(keys: string[]) {
    const deletePromises = keys.map(key => this.deleteFile(key));
    const results = await Promise.allSettled(deletePromises);
    
    return results.map((result, index) => ({
      key: keys[index],
      success: result.status === 'fulfilled' && result.value,
    }));
  }
}