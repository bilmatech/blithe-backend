import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ThirdPartyModule } from '@Blithe/third-party/third-party.module';
import { LedgerService } from './ledger.service';
import { TransactionModule } from '@Blithe/transaction/transaction.module';
import { EncryptionModule } from '@Blithe/encryption/encryption.module';
import { BullModule } from '@nestjs/bullmq';
import { WalletQueue } from './queue/wallet.queue';
import { WalletEmitterService } from './wallet-emitter.service';
import { DatabaseModule } from '@Blithe/database/database.module';
import { AccountModule } from '@Blithe/account/account.module';
import { WalletProcessor } from './queue/wallet.processor';
import { FunnelsModule } from '@Blithe/funnels/funnels.module';
import { WebhookController } from './webhook.controller';
import { ConfigModule } from '@nestjs/config';
import thirdPartyConfig from '@Blithe/third-party/config/third-party.config';
import { BankingModule } from '@Blithe/banking/banking.module';
import { NotificationQueue } from '@Blithe/notifications/consts/notification.const';
import redisConfig from '@Blithe/common/config/redis.config';
import { TransferQueue } from '@Blithe/transfer/queue/transfer.queue';
import { FirebaseMessagingModule } from '@Blithe/firebase-messaging/firebase-messaging.module';

@Module({
  imports: [
    DatabaseModule,
    ThirdPartyModule,
    forwardRef(() => TransactionModule),
    EncryptionModule,
    BullModule.registerQueue({
      name: WalletQueue,
    }),
    BullModule.registerQueue({
      name: NotificationQueue,
    }),
    // Import TransferQueue for @InjectQueue to work
    BullModule.registerQueue({
      name: TransferQueue,
    }),
    AccountModule,
    forwardRef(() => FunnelsModule),
    ConfigModule.forFeature(thirdPartyConfig),
    ConfigModule.forFeature(redisConfig),
    forwardRef(() => BankingModule),
    FirebaseMessagingModule,
  ],
  controllers: [WalletController, WebhookController],
  providers: [
    WalletService,
    LedgerService,
    WalletEmitterService,
    WalletProcessor,
  ],
  exports: [WalletService, LedgerService, WalletEmitterService],
})
export class WalletModule {}
