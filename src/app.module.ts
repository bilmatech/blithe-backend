import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './services/notifications/notification.module';
import { EmailModule } from './services/email/email.module';
import { BullModule } from '@nestjs/bullmq';
import { AccountModule } from './services/account/account.module';
import { AuthModule } from './services/auth/auth.module';
import { WalletModule } from './services/wallet/wallet.module';
import { VerificationModule } from './services/verification/verification.module';
import { FirebaseMessagingModule } from './services/firebase-messaging/firebase-messaging.module';
import { FirebaseAdminModule } from './common/firebase/firebase-admin.module';
import { DatabaseModule } from './services/database/database.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { MediaModule } from './services/media/media.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    BullModule.forRoot({
      connection: {
        username: process.env.REDIS_USERNAME, // Optional username for Redis
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD, // Optional password for Redis
      },
      defaultJobOptions: {
        backoff: {
          type: 'exponential',
          delay: 30000, // Initial delay of 30 seconds before the first retry
        },
        attempts: 5, // Retry a maximum of 5 times
        removeOnComplete: {
          age: 604800, // Remove jobs after 7 days
          count: 1000, // Keep only the most recent 1000 jobs
        },
        removeOnFail: {
          age: 604800, // Remove failed jobs after 7 days
          count: 1000, // Keep only the most recent 1000 failed jobs
        },
      },
    }),
    EmailModule,
    NotificationModule,
    AccountModule,
    AuthModule,
    WalletModule,
    VerificationModule,
    FirebaseMessagingModule,
    FirebaseAdminModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
