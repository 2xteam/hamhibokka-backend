import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AzureUploadService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor(private configService: ConfigService) {
    // Azure Blob Storage 클라이언트 초기화
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.containerName =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') || '';

    if (!connectionString || !this.containerName) {
      throw new Error('Required Azure Storage configuration is missing');
    }

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
  }

  /**
   * 스티커 이미지 업로드
   * @param file - 업로드할 파일
   * @param userId - 업로드하는 사용자 ID
   * @returns 업로드된 이미지 정보
   */
  async uploadStickerImage(
    file: Express.Multer.File,
    userId: string,
    name?: string,
    category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    // 파일 타입 검증
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    }

    try {
      // 고유한 파일명 생성
      const stickerImageId = uuidv4();
      const originalKey = `stickers/${stickerImageId}/original.${this.getFileExtension(file.originalname)}`;

      // Azure Blob Storage에 업로드 (원본 파일 그대로)
      await this.uploadToBlob(originalKey, file.buffer, file.mimetype);

      // 공개 URL 생성
      const imageUrl = this.getPublicUrl(originalKey);

      return {
        originalUrl: imageUrl,
        thumbnailUrl: imageUrl, // 임시로 원본과 동일하게 설정
        stickerImageId,
        name: name || file.originalname,
        uploadedBy: userId,
        category: category || '기본',
        fileSize: file.size,
        contentType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
    }
  }

  /**
   * 이미지 리사이징 (임시로 비활성화)
   */
  private async resizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
    // Sharp 모듈 문제로 임시 비활성화
    return buffer;
  }

  /**
   * Azure Blob Storage에 파일 업로드
   */
  private async uploadToBlob(key: string, buffer: Buffer, contentType: string) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'max-age=31536000', // 1년 캐시
      },
    });
  }

  /**
   * 파일의 공개 URL 생성
   */
  private getPublicUrl(key: string): string {
    const cdnDomain = this.configService.get('AZURE_CDN_DOMAIN');

    if (cdnDomain) {
      return `${cdnDomain}/${key}`;
    }

    // Azure Storage 계정의 기본 URL 사용
    const accountName = this.configService.get('AZURE_STORAGE_ACCOUNT_NAME');
    const region =
      this.configService.get('AZURE_STORAGE_REGION') || 'core.windows.net';

    return `https://${accountName}.blob.${region}/${this.containerName}/${key}`;
  }

  /**
   * Azure Blob Storage에서 파일 삭제
   */
  async deleteFile(key: string) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(key);
      await blockBlobClient.delete();
    } catch (error) {
      console.error('파일 삭제 실패:', error);
    }
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }
}
