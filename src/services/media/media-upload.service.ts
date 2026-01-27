import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { ConfigService } from '@nestjs/config';
import { SignedUrlDto } from './dtos/signed-url.dto';
import { AppError } from '@Blithe/common/utils/error-handler.util';

@Injectable()
export class MediaUploadService {
  constructor(
    private readonly awsS3Service: AwsS3Service,
    private config: ConfigService,
  ) {}

  /**
   * Uploads an image file to the media storage.
   * @param uploadFile The image file to upload.
   * @returns The URL of the uploaded image.
   */
  async uploadImageMedia(uploadFile: Express.Multer.File) {
    try {
      const { buffer, originalname, mimetype } = uploadFile;

      // Validate file type
      if (!mimetype.startsWith('image/')) {
        throw new AppError('Invalid file type. Only images are allowed.');
      }

      const folder =
        this.config.get<string>('NODE_ENV') === 'production'
          ? 'prod-assets'
          : 'dev-assets';

      return this.awsS3Service.singleUpload(
        buffer,
        originalname,
        mimetype,
        folder,
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }
      throw new InternalServerErrorException('Failed to upload image media', {
        cause: error,
      });
    }
  }

  async signedUrl(signedUrlDto: SignedUrlDto) {
    try {
      const { fileName, mimeType, folder = 'medias' } = signedUrlDto;

      // Validate required fields
      if (!fileName || !mimeType) {
        throw new AppError('File name and MIME type are required.');
      }

      // Generate signed URL using AWS S3 service
      const signedUrlData = await this.awsS3Service.signedUrl(
        fileName,
        mimeType,
        folder,
      );

      return signedUrlData;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException('Failed to generate signed URL', {
        cause: error,
      });
    }
  }

  /**
   * Deletes a media file from the storage.
   * @param fileUrl The URL of the file to delete.
   * @returns An object indicating whether the deletion was successful and the file URL.
   */
  async deleteMediaFile(fileUrl: string) {
    try {
      // Validate file URL
      if (!fileUrl) {
        throw new AppError('File URL is required for deletion.');
      }

      // Extract the key from the file URL
      // example: https://fyyndfit-asset.s3.us-west-2.amazonaws.com/dev-assets/1e750136-e48e-4059-9fd4-f25e65e716d7.jpg
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(3).join('/'); // Skip the first three parts (bucket name and region)

      // Call AWS S3 service to delete the file
      const isDeleted = await this.awsS3Service.deleteFile(key);
      return { isDeleted, deletedFile: fileUrl };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }
      throw new InternalServerErrorException('Failed to delete media file', {
        cause: error,
      });
    }
  }
}
