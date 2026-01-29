import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaystackGuard } from '@Blithe/services/third-party/paystack/guards/paystack.guard';
import { WebhookPayload } from './wallet.types';
import { WalletEnqueueService } from './queue/wallet-enqueue.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly walletEnqueueService: WalletEnqueueService) {}

  @UseGuards(PaystackGuard)
  @Post('paystack')
  async handlePaystackWebhook(@Body() payload: WebhookPayload) {
    await this.walletEnqueueService.handleWebhook(payload);

    return { status: 'success' };
  }
}
