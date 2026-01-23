import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  NotificationQueue,
  NotificationType,
  NotificationJobData as QueueJobData,
  QueueNames,
} from './notification.queue';
import { EmailService } from '@Blithe/services/email/email.service';

import { Job } from 'bullmq';
import { AppLogger } from '@Blithe/common/utils/logger.util';
import { Logger } from '@nestjs/common';

@Processor(NotificationQueue)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<QueueJobData, any, QueueNames>): Promise<void> {
    job.updateProgress(10);
    switch (job.name) {
      case QueueNames.EMAIL_QUEUE:
        job.updateProgress(50);

        await this.handleEmailJob(job.data);
        job.updateProgress(100);
        break;
      default:
        break;
    }
  }

  private async handleEmailJob(data: QueueJobData<NotificationType>) {
    try {
      switch (data.type) {
        case NotificationType.AccountVerification: {
          await this.emailService.sendAccountVerificationEmail(
            data.payload.to,
            data.payload.code,
          );

          break;
        }

        case NotificationType.ForgotPassword:
          await this.emailService.sendPasswordResetEmail(
            data.payload.to,
            data.payload.code,
          );

          break;

        default:
          break;
      }
    } catch (error) {
      AppLogger.error(error);

      throw error;
    }
  }
}
