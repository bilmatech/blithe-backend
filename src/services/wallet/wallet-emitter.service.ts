import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { WalletQueue } from './queue/wallet.queue';
import { WalletEvents, WalletJobPayload } from './queue/wallet-queue.types';
import { WebhookEvent, WebhookPayload } from './wallet.types';
import {
  TransferEvents,
  TransferQueue,
} from '@Blithe/transfer/queue/transfer.queue';
import { TransactionDto } from '@Blithe/transaction/dto/transaction.dto';

@Injectable()
export class WalletEmitterService {
  constructor(
    @InjectQueue(WalletQueue)
    private readonly queue: Queue<WalletJobPayload>,
    @InjectQueue(TransferQueue)
    private readonly transferQueue: Queue<WebhookPayload['data']>,
  ) {}

  emitCreateWalletJob(userId: string) {
    return this.queue.add(WalletEvents.CREATE_WALLET, { payload: userId });
  }

  async emitWalletJob(webhookPayload: WebhookPayload) {
    switch (webhookPayload.event) {
      case WebhookEvent.CHARGE_SUCCESS:
        await this.queue.add(WalletEvents.FUND_WALLET, {
          payload: webhookPayload,
        });
        break;

      case WebhookEvent.TRANSFER_SUCCESS:
        await this.transferQueue.add(
          TransferEvents.TRANSFER_SUCCESS,
          webhookPayload.data,
        );
        break;

      case WebhookEvent.TRANSFER_FAILED:
        await this.transferQueue.add(
          TransferEvents.TRANSFER_FAILED,
          webhookPayload.data,
        );
        break;

      case WebhookEvent.TRANSFER_REVERSED:
        await this.transferQueue.add(
          TransferEvents.TRANSFER_REVERSED,
          webhookPayload.data,
        );
        break;

      default:
        break;
    }
  }

  emitCreditWalletJob(walletAddress: string, transaction: TransactionDto) {
    return this.queue.add(WalletEvents.CREDIT_WALLET, {
      payload: { walletAddress, transaction },
    });
  }
}
