import { Processor, WorkerHost } from '@nestjs/bullmq';
import { WalletQueue } from './wallet.queue';
import { WalletService } from '../wallet.service';
import { Job } from 'bullmq';
import { WalletEvents, WalletJobPayload } from './wallet-queue.types';
import {
  CreditWalletPayload,
  WebhookEvent,
  WebhookPayload,
} from '../wallet.types';

import { AppError } from '@Blithe/common/utils/error-handler.util';
import { ConfigType } from '@nestjs/config';
import redisConfig from '@Blithe/common/config/redis.config';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Processor(WalletQueue, {
  concurrency: 5, // Process five jobs at a time
})
export class WalletProcessor extends WorkerHost {
  private redis: Redis;
  constructor(
    private readonly walletService: WalletService,
    @Inject(redisConfig.KEY)
    private readonly redisConfigs: ConfigType<typeof redisConfig>,
  ) {
    super();

    // Initialize Redis client for direct interactions if needed
    this.redis = new Redis(this.redisConfigs.port, this.redisConfigs.host, {
      password: this.redisConfigs.password,
    });
  }

  async process(job: Job<WalletJobPayload, any, WalletEvents>) {
    const lockKey = `lock:wallet:(key)`;
    switch (job.name) {
      case WalletEvents.CREATE_WALLET:
        lockKey.replace('(key)', job.data.payload as string);
        break;

      case WalletEvents.FUND_WALLET: {
        const { data: eventData } = job.data.payload as WebhookPayload;
        lockKey.replace('(key)', eventData.customer.customer_code);
        break;
      }
      case WalletEvents.CREDIT_WALLET: {
        const { walletAddress } = job.data.payload as CreditWalletPayload;
        lockKey.replace('(key)', walletAddress);
        break;
      }

      default:
        throw new AppError('Could not determine job lock key');
    }

    // try to acquire lock
    const isLocked = await this.redis.set(lockKey, 'locked', 'PX', 60000, 'NX'); // 1 min TTL
    if (!isLocked) {
      throw new AppError('Job is already being processed elsewhere');
    }

    try {
      job.updateProgress(10);
      switch (job.name) {
        case WalletEvents.CREATE_WALLET: {
          job.updateProgress(50);

          // Create new user wallet and associated funnels pool
          const wallet = await this.walletService.create(
            job.data.payload as string,
          );

          job.updateProgress(100);
          break;
        }

        case WalletEvents.FUND_WALLET: {
          const webhookPayload = job.data.payload as WebhookPayload;
          switch (webhookPayload.event) {
            case WebhookEvent.CHARGE_SUCCESS: {
              job.updateProgress(50);

              await this.walletService.handleWalletFunding(webhookPayload.data);
              job.updateProgress(100);

              break;
            }

            default:
              break;
          }
          break;
        }

        case WalletEvents.CREDIT_WALLET: {
          const { walletAddress, transaction } = job.data
            .payload as CreditWalletPayload;

          await this.walletService.credit(walletAddress, transaction);

          job.updateProgress(100);
          break;
        }

        default:
          break;
      }
    } finally {
      // Release the lock
      await this.redis.del(lockKey);
    }
  }
}
