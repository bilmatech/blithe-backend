import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
