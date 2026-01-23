import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { InAppNotificationService } from './in-app-notification.service';
import { EmailModule } from '../email/email.module';
import { NotificationEnqueueService } from './notification-enqueue.service';
import { NotificationProcessor } from './queue/notification.processor';
import { BullModule } from '@nestjs/bullmq';
import { NotificationQueue } from './queue/notification.queue';

@Module({
  imports: [
    EmailModule,
    BullModule.registerQueue({
      name: NotificationQueue,
    }),
  ],
  providers: [
    PushNotificationService,
    InAppNotificationService,
    NotificationEnqueueService,
    NotificationProcessor,
  ],
  exports: [NotificationEnqueueService],
})
export class NotificationModule {}
