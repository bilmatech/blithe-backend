import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import encryptionConfig from './encryption.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(encryptionConfig)],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
