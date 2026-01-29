import { Injectable } from '@nestjs/common';
import { PrismaService, PrismaTransaction } from '../database/prisma.service';
import { CreateWalletTransactionDto } from './dto/create-wallet-transaction.dto';
import {
  Prisma,
  TransactionFlow,
  TransactionStatus,
  TransactionType,
} from '@DB/Client';
import { generateTransactionReference } from '@Blithe/common/utils/string.util';

@Injectable()
export class WalletTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  createDeposit(
    createWalletTransactionDto: CreateWalletTransactionDto,
    tranxSession: PrismaTransaction,
  ) {
    return this.create(
      createWalletTransactionDto,
      TransactionType.Deposit,
      TransactionFlow.Inflow,
      tranxSession,
    );
  }

  createWithdrawal(
    createWalletTransactionDto: CreateWalletTransactionDto,
    tranxSession: PrismaTransaction,
  ) {
    return this.create(
      createWalletTransactionDto,
      TransactionType.Withdrawal,
      TransactionFlow.Outflow,
      tranxSession,
    );
  }

  createTransfer(
    createWalletTransactionDto: CreateWalletTransactionDto,
    tranxSession: PrismaTransaction,
  ) {
    return this.create(
      createWalletTransactionDto,
      TransactionType.Transfer,
      TransactionFlow.Outflow,
      tranxSession,
    );
  }

  createReversal(
    createWalletTransactionDto: CreateWalletTransactionDto,
    tranxSession: PrismaTransaction,
  ) {
    return this.create(
      createWalletTransactionDto,
      TransactionType.Reversal,
      TransactionFlow.Inflow,
      tranxSession,
    );
  }

  updateStatus(
    transactionId: string,
    status: TransactionStatus,
    tranxSession: PrismaTransaction,
  ) {
    const processedAt =
      status === TransactionStatus.success ? new Date() : null;
    return tranxSession.walletTransaction.update({
      where: { id: transactionId },
      data: { status, processedAt },
    });
  }

  updateStatusWithoutSession(transactionId: string, status: TransactionStatus) {
    const processedAt =
      status === TransactionStatus.success ? new Date() : null;
    return this.prisma.walletTransaction.update({
      where: { id: transactionId },
      data: { status, processedAt },
    });
  }

  //   ===================================================================
  //                         PRIVATE METHODS
  //   ===================================================================

  private create(
    createWalletTransactionDto: CreateWalletTransactionDto,
    type: TransactionType,
    direction: TransactionFlow,
    tranxSession: PrismaTransaction,
  ) {
    // Generate reference if not provided
    const reference =
      createWalletTransactionDto.reference ||
      generateTransactionReference('TXN');

    // Calculate transaction net amount
    const netAmount = new Prisma.Decimal(
      createWalletTransactionDto.amount,
    ).minus(new Prisma.Decimal(createWalletTransactionDto.fees));

    return tranxSession.walletTransaction.create({
      data: {
        walletId: createWalletTransactionDto.walletId,
        amount: createWalletTransactionDto.amount,
        netAmount: netAmount,
        fees: createWalletTransactionDto.fees,
        reference,
        desc: createWalletTransactionDto.desc,
        type,
        flow: direction,
        transactionAt: new Date(),
        status: TransactionStatus.pending,
      },
    });
  }
}
