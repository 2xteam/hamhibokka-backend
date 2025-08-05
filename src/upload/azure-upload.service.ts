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
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.containerName =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') || '';

    if (connectionString && this.containerName) {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );
      console.log('Azure Storage initialized successfully');
    } else {
      console.log('Azure Storage configuration not found, using dummy URLs');
    }
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
    // 개발 환경에서는 삭제 작업을 건너뜀
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log('Development mode: File deletion skipped for key:', key);
      return;
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(key);
      await blockBlobClient.delete();
    } catch (error) {
      console.error('Error deleting file from Azure Storage:', error);
      throw new BadRequestException('파일 삭제에 실패했습니다.');
    }
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'jpg';
  }

  async uploadProfileImage(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    }

    try {
      // 고유한 파일명 생성
      const profileImageId = uuidv4();
      const originalKey = `profiles/${profileImageId}/original.${this.getFileExtension(file.originalname)}`;

      // Azure Storage가 설정되어 있으면 실제 업로드
      if (this.containerClient) {
        // Azure Blob Storage에 업로드 (원본 파일 그대로)
        await this.uploadToBlob(originalKey, file.buffer, file.mimetype);

        // 공개 URL 생성
        const imageUrl = this.getPublicUrl(originalKey);

        return {
          originalUrl: imageUrl,
          thumbnailUrl: imageUrl, // 임시로 원본과 동일하게 설정
          profileImageId,
          fileSize: file.size,
          contentType: file.mimetype,
        };
      } else {
        // Azure Storage 설정이 없으면 더미 URL 반환
        const imageUrl = `http://localhost:3000/dummy/${originalKey}`;
        return {
          originalUrl: imageUrl,
          thumbnailUrl: imageUrl,
          profileImageId,
          fileSize: file.size,
          contentType: file.mimetype,
        };
      }
    } catch (error) {
      throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
    }
  }
}
