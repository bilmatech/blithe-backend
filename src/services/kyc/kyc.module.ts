import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { EncryptionModule } from '../encryption/encryption.module';
import { MediaUploadService } from '../media/media-upload.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    EncryptionModule,
  ],
  controllers: [KycController],
  providers: [
    KycService,
    PrismaService,
    MediaUploadService,
  ],
})
export class KycModule {}
