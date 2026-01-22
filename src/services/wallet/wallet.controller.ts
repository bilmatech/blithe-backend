import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorizedUser } from '@Blithe/auth/decorators/authorized-user.decorator';
import { AuthUser } from '@Blithe/auth/auth.type';
import { JwtAuthGuard } from '@Blithe/auth/guards/auth.guard';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
import { Prisma } from '@DB/Client';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // -------------------------------------------------------------------
  @ApiOperation({ summary: 'Get Wallet Info' })
  // -------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // -------------------------------------------------------------------
  @ResponseMessage('Successfully retrieved wallet information.')
  // -------------------------------------------------------------------
  @Get()
  async getWalletInfo(@AuthorizedUser() user: AuthUser) {
    const wallet = await this.walletService.getUserWallet(user.id);
    return {
      ...wallet,
      balance: new Prisma.Decimal(wallet?.balance as string).toDecimalPlaces(2),
      ngnBalance: new Prisma.Decimal(wallet?.balance as string)
        .toDecimalPlaces(2)
        .toNumber()
        .toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
    };
  }
}
