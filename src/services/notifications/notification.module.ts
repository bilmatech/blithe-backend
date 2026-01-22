import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { InAppNotificationService } from './in-app-notification.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [PushNotificationService, InAppNotificationService],
})
export class NotificationModule {}
