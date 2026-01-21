import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { EncryptionModule } from '../encryption/encryption.module';

@Global()
@Module({
  imports: [EncryptionModule, ConfigModule.forFeature(databaseConfig)],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
