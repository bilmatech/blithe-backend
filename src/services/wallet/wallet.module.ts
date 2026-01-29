import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ThirdPartyModule } from '@Blithe/services/third-party/third-party.module';
import { LedgerService } from './ledger.service';
import { EncryptionModule } from '@Blithe/services/encryption/encryption.module';
import { BullModule } from '@nestjs/bullmq';
import { WalletQueue } from './queue/wallet.queue';
import { AccountModule } from '@Blithe/services/account/account.module';
import { WalletProcessor } from './queue/wallet.processor';
import { WebhookController } from './webhook.controller';
import { ConfigModule } from '@nestjs/config';
import thirdPartyConfig from '@Blithe/services/third-party/config/third-party.config';
import redisConfig from '@Blithe/common/config/redis.config';
import { WalletEnqueueService } from './queue/wallet-enqueue.service';
import { WalletTransactionService } from './wallet-transaction.service';

@Module({
  imports: [
    ThirdPartyModule,
    EncryptionModule,
    BullModule.registerQueue({
      name: WalletQueue,
    }),

    AccountModule,
    ConfigModule.forFeature(thirdPartyConfig),
    ConfigModule.forFeature(redisConfig),
  ],
  controllers: [WalletController, WebhookController],
  providers: [
    WalletService,
    LedgerService,
    WalletEnqueueService,
    WalletProcessor,
    WalletTransactionService,
  ],
  exports: [WalletService, LedgerService, WalletEnqueueService],
})
export class WalletModule {}
