import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WalletEmitterService } from './wallet-emitter.service';
import { PaystackGuard } from '@Blithe/services/third-party/paystack/guards/paystack.guard';
import { WebhookPayload } from './wallet.types';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly walletEmitterService: WalletEmitterService) {}

  @UseGuards(PaystackGuard)
  @Post('paystack')
  async handlePaystackWebhook(@Body() payload: WebhookPayload) {
    await this.walletEmitterService.emitWalletJob(payload);

    return { status: 'success' };
  }
}
