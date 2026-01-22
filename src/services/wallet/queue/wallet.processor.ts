import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { WalletQueue } from './wallet.queue';
import { WalletService } from '../wallet.service';
import { Job, Queue } from 'bullmq';
import { WalletEvents, WalletJobPayload } from './wallet-queue.types';
import {
  CreditWalletPayload,
  WebhookEvent,
  WebhookPayload,
} from '../wallet.types';
import {
  NotificationEvents,
  NotificationProcessorJobPayload,
  NotificationType,
} from '@Blithe/notifications/notification.types';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { NotificationQueue } from '@Blithe/notifications/consts/notification.const';
import { FunnelPoolService } from '@Blithe/funnels/funnel-pool.service';
import { ConfigType } from '@nestjs/config';
import redisConfig from '@Blithe/common/config/redis.config';
import { forwardRef, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { formatAmountToNumber } from '@Blithe/common/utils/funcs.util';
import { FirebaseMessagingService } from '@Blithe/firebase-messaging/firebase-messaging.service';
import { PushMessageType } from '@Blithe/firebase-messaging/dto/push-message.dto';

@Processor(WalletQueue, {
  concurrency: 5, // Process five jobs at a time
})
export class WalletProcessor extends WorkerHost {
  private redis: Redis;
  constructor(
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => FunnelPoolService))
    private readonly funnelPoolService: FunnelPoolService,
    @InjectQueue(NotificationQueue)
    private readonly queue: Queue<NotificationProcessorJobPayload>,
    @Inject(redisConfig.KEY)
    private readonly redisConfigs: ConfigType<typeof redisConfig>,
    private readonly firebaseMessagingService: FirebaseMessagingService,
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
          await this.funnelPoolService.initializeUserFunnelsPool(wallet.userId);

          // Welcome user onboard with a congratulatory message on successful wallet creation (use emojis for better engagement)
          await this.firebaseMessagingService.pushMessage(wallet.userId, {
            title: `🎉 Welcome to SabiFlow, ${wallet.user.firstName ?? 'there'}!`,
            body: 'Your SabiFlow wallet is ready! Start managing and growing your funds effortlessly.',
            data: {
              type: PushMessageType.WALLET_CREATED,
              wallet: {
                address: wallet.address,
                name: wallet.name || '',
                tag: wallet.tag || '',
                routingNumber: wallet.routingNumber || '',
              },
            },
          });
          job.updateProgress(100);
          break;
        }

        case WalletEvents.FUND_WALLET: {
          const webhookPayload = job.data.payload as WebhookPayload;
          switch (webhookPayload.event) {
            case WebhookEvent.CHARGE_SUCCESS: {
              job.updateProgress(50);

              const walletFundingResult =
                await this.walletService.handleWalletFunding(
                  webhookPayload.data,
                );
              if (walletFundingResult) {
                // Notify user via push notification (use emojis for better engagement)

                const walletFundedAmount =
                  walletFundingResult.transaction.netAmount
                    .toNumber()
                    .toLocaleString('en-NG', {
                      currency: 'NGN',
                      style: 'currency',
                    });
                await this.firebaseMessagingService.pushMessage(
                  walletFundingResult.user.id,
                  {
                    title: `💰 Wallet Funded Successfully!`,
                    body: `Your wallet has been credited with ${walletFundedAmount} successfully.`,
                    data: {
                      type: PushMessageType.WALLET_FUNDED,
                      funding: {
                        amount:
                          walletFundingResult.transaction.netAmount.toNumber(),
                        formattedAmount: walletFundedAmount,
                        transactionId: walletFundingResult.transaction.id,
                      },
                    },
                  },
                );

                // Credit the funded amount to user's funnels pool
                const funnelPoolCredited =
                  await this.funnelPoolService.creditPoolBalance(
                    walletFundingResult.user.id,
                    walletFundingResult.transaction.netAmount,
                    walletFundingResult.transaction.id,
                  );

                // Notify user of successful wallet funding
                await this.queue.add(NotificationType.EMAIL, {
                  event: NotificationEvents.creditAlert,
                  type: NotificationType.EMAIL,
                  data: {
                    to: walletFundingResult.user.email,
                    title: 'Wallet Funded Successfully',
                    amount: formatAmountToNumber(
                      walletFundingResult.transaction.netAmount.toString(),
                    ),
                    name: walletFundingResult.user.firstName as string,
                  },
                });

                // Funnel pool credited notification (use emojis for better engagement)
                await this.firebaseMessagingService.pushMessage(
                  walletFundingResult.user.id,
                  {
                    title: `🏦 Funnels Pool Credited!`,
                    body: `Your funnels pool has been credited with ${walletFundedAmount}. You funds are now being funneled to your funnels, open SabiFlow now and check out the magic.`,
                    data: {
                      type: PushMessageType.FUNNEL_POOL_CREDITED,
                      funnelPoolCredited: {
                        type: 'credit',
                        amount:
                          walletFundingResult.transaction.netAmount.toNumber(),
                        formattedAmount: walletFundedAmount,
                        transactionId: funnelPoolCredited.id,
                      },
                    },
                  },
                );

                // Complete job
                job.updateProgress(100);
              } else {
                job.updateProgress(0);
                throw new AppError('Failed to process wallet funding event');
              }
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
