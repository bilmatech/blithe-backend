import { Injectable } from '@nestjs/common';
import { FirebaseService } from '@Blithe/common/firebase/firebase.service';
import { PrismaService } from '@Blithe/database/prisma.service';
import { PushMessageDto } from './dto/push-message.dto';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class FirebaseMessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   *  Create or update a firebase token for a user
   * @param userId  The ID of the user
   * @param token The firebase token
   * @returns The created or updated firebase token record
   */
  create(userId: string, token: string) {
    return this.prisma.firebaseToken.upsert({
      where: { userId },
      update: { token },
      create: { userId, token },
    });
  }

  /**
   * Find a firebase token record by user ID
   * @param userId The ID of the user
   * @returns The firebase token record or null if not found
   */
  findOne(userId: string) {
    return this.prisma.firebaseToken.findUnique({ where: { userId } });
  }
  /**
   * Push a message to a user's device using Firebase Cloud Messaging
   * @param userId The ID of the user to send the message to
   * @param payload The message payload containing title, body, and optional data
   */
  async pushMessage(userId: string, payload: PushMessageDto): Promise<void> {
    try {
      const firebase = this.firebaseService.firebaseApp;

      const firebaseTokenRecord = await this.findOne(userId);
      if (firebaseTokenRecord) {
        await firebase.messaging().send({
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            title: payload.title,
            message: payload.body,
          },
          token: firebaseTokenRecord.token as string,
        });
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new AppError('Failed to send push message', 500);
    }
  }
}
