import { Module } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { MediaUploadService } from './media-upload.service';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';

@Module({
  imports: [ConfigModule],
  providers: [AwsS3Service, MediaUploadService],
  controllers: [MediaController],
  exports: [MediaUploadService, AwsS3Service], // Export services for use in other modules
})
export class MediaModule {}
