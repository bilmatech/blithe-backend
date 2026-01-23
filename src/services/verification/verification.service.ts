import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationEnqueueService } from '../notifications/notification-enqueue.service';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { uniqueId } from '@Blithe/common/utils/string.util';
import {
  NotificationType,
  QueueNames,
} from '../notifications/queue/notification.queue';
import { VerificationType } from '@DB/Client';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEnqueuer: NotificationEnqueueService,
  ) {}

  async sendVerificationCode(
    userId: string,
    email: string,
    type: VerificationType = VerificationType.account_activation,
    notification: NotificationType = NotificationType.AccountVerification,
  ) {
    const code = uniqueId(6, true);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // get existing verification
    const existingVerification = await this.prisma.verification.findFirst({
      where: {
        userId: userId,
        type: type,
      },
    });
    if (!existingVerification) {
      await this.prisma.verification.create({
        data: {
          userId,
          code,
          expiresAt,
          used: false,
          type,
        },
      });
    } else {
      await this.prisma.verification.update({
        where: {
          id: existingVerification.id,
        },
        data: {
          code,
          expiresAt,
          used: false,
        },
      });
    }

    await this.notificationEnqueuer.enqueueNotificationJob(
      QueueNames.EMAIL_QUEUE,
      {
        type: notification,
        payload: {
          to: email,
          code,
        },
      },
    );

    return true;
  }

  async verifyCode(code: string) {
    const verification = await this.prisma.verification.findFirst({
      where: {
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    });
    if (!verification) {
      throw new AppError('Invalid verification code');
    }
    if (verification.used) {
      throw new AppError('Verification code has already been used');
    }
    if (verification.expiresAt < new Date()) {
      throw new AppError('Verification code has expired');
    }
    await this.markAsUsed(verification.id);
    return { user: verification.user, valid: true };
  }

  markAsUsed(id: string) {
    return this.prisma.verification.update({
      where: { id },
      data: { used: true },
    });
  }

  findOne(code: string) {
    return this.prisma.verification.findUnique({
      where: { code },
    });
  }
}
