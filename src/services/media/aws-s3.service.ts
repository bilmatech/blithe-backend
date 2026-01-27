import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  ObjectCannedACL,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { AppError } from '@Blithe/common/utils/error-handler.util';

@Injectable()
export class AwsS3Service {
  private client: S3Client;

  constructor(private config: ConfigService) {
    this.client = new S3Client({
      region: config.get('AWS_REGION') as string,
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY') as string,
      },
    });
  }

  /**
   * Uploads a file to AWS S3 and returns the file URL.
   * @param fileStream The file stream to be uploaded.
   * @param filename The name of the file to be uploaded.
   * @param mimetype The MIME type of the file.
   * @param folder The folder in S3 where the file will be uploaded.
   * @returns The URL of the uploaded file or false if the upload fails.
   */
  async singleUpload(
    fileStream: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'medias',
  ): Promise<string | false> {
    try {
      // Validate parameters required
      if (!this.config.get('AWS_REGION') || !fileStream)
        throw new AppError('Invalid parameters');

      // get file extension
      const fileExtension = filename.split('.').pop();
      // construct the file name and key
      const fileName = `${uuid()}.${fileExtension}`;
      const _key = `${folder || 'assets'}/${fileName}`;

      // upload file to S3
      const params: PutObjectCommandInput = {
        Bucket: this.config.get('AWS_BUCKET_NAME') as string,
        Key: _key,
        Body: fileStream,
        ACL: ObjectCannedACL.public_read,
        ContentType: mimetype,
      };

      // new command
      const command = new PutObjectCommand(params);

      const data = await this.client.send(command);

      //   Construct the url
      const url = `https://${this.config.get('AWS_BUCKET_NAME')}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${_key}`;

      return data?.$metadata?.httpStatusCode === 200 ? url : false;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }
      throw new InternalServerErrorException(
        'Error generating signed URL for S3 upload',
        { cause: error },
      );
    }
  }

  /**
   * Generates a signed URL for uploading a file to S3.
   * @param filename The name of the file to be uploaded.
   * @param mimetype The MIME type of the file.
   * @param folder The folder in S3 where the file will be uploaded.
   * @param expiresIn The expiration time for the signed URL in seconds.
   * @returns An object containing the signed URL and the file URL.
   */
  async signedUrl(
    filename: string,
    mimetype: string,
    folder: string = 'medias',
    expiresIn: number = 3600, // Default to 1 hour
  ) {
    try {
      // Validate parameters required
      if (!this.config.get('AWS_REGION')) {
        throw new AppError('Invalid parameters');
      }

      // get file extension
      const fileExtension = filename.split('.').pop();
      // construct the file name and key
      const fileId = uuid();
      const fileName = `${fileId}.${fileExtension}`;
      const _key = `${folder || 'assets'}/${fileName}`;
      let videoUrl: string | null = null;
      let url = '';

      // upload file to S3
      const params: PutObjectCommandInput = {
        Bucket: this.config.get('AWS_BUCKET_NAME') as string,
        Key: _key,
        ACL: ObjectCannedACL.public_read,
        ContentType: mimetype,
      };

      // new command
      const command = new PutObjectCommand(params);

      const data = await getSignedUrl(this.client, command, {
        expiresIn, // Set the expiration time for the signed URL
      });

      // Construct the url
      const urlPlaceholder = `https://${this.config.get('AWS_BUCKET_NAME')}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/[:path]`;

      if (mimetype.startsWith('video/')) {
        // The final key will resolve to this: /processed/dcd2fb0d-b9a2-4def-b81b-87ab5ebe69e0/dcd2fb0d-b9a2-4def-b81b-87ab5ebe69e0.m3u8

        videoUrl = urlPlaceholder.replace(
          '[:path]',
          `processed/${fileId}/${fileId}.m3u8`,
        );
      }
      url = urlPlaceholder.replace('[:path]', _key);
      return { endpoint: data, file: url, expiresIn, video: videoUrl };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }
      throw new InternalServerErrorException(
        'Error generating signed URL for S3 upload',
        { cause: error },
      );
    }
  }

  /**
   * Deletes a file from AWS S3.
   * @param key The key of the file to be deleted.
   * @returns True if the file was successfully deleted, false otherwise.
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.config.get('AWS_REGION') || !key)
        throw new Error('Invalid parameters');

      // Construct the delete command
      const params = {
        Bucket: this.config.get('AWS_BUCKET_NAME') as string,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);

      const data = await this.client.send(command);

      return data?.$metadata?.httpStatusCode === 204;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }
      throw new InternalServerErrorException(
        'Error generating signed URL for S3 upload',
        { cause: error },
      );
    }
  }
}
