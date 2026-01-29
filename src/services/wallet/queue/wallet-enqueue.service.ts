import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { WalletQueue } from './wallet.queue';
import { WalletEvents, WalletJobPayload } from './wallet-queue.types';
import { WebhookEvent, WebhookPayload } from '../wallet.types';

@Injectable()
export class WalletEnqueueService {
  constructor(
    @InjectQueue(WalletQueue)
    private readonly queue: Queue<WalletJobPayload>,
  ) {}

  createWallet(userId: string) {
    return this.queue.add(WalletEvents.CREATE_WALLET, { payload: userId });
  }

  async handleWebhook(webhookPayload: WebhookPayload) {
    switch (webhookPayload.event) {
      case WebhookEvent.CHARGE_SUCCESS:
        await this.queue.add(WalletEvents.FUND_WALLET, {
          payload: webhookPayload,
        });
        break;

      case WebhookEvent.TRANSFER_SUCCESS:
        //  Handle transfer success event
        break;

      case WebhookEvent.TRANSFER_FAILED:
        // Handle transfer failed event
        break;

      case WebhookEvent.TRANSFER_REVERSED:
        // Handle transfer reversed event
        break;

      default:
        break;
    }
  }

  creditWallet(walletAddress: string, transaction: any) {
    return this.queue.add(WalletEvents.CREDIT_WALLET, {
      payload: { walletAddress, transaction },
    });
  }
}
