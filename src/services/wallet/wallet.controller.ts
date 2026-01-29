import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
import { Prisma } from '@DB/Client';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { AuthorizedUser } from '../auth/decorators/authorized-user.decorator';
import { AuthUser } from '../auth/auth.type';

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
  getWalletInfo(@AuthorizedUser() user: AuthUser) {
    this.walletService.getUserWallet(user.id);
  }
}
