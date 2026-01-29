import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaystackService } from '@Blithe/services/third-party/paystack/paystack.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { AccountService } from '@Blithe/services/account/account.service';
import {
  Prisma,
  TransactionFlow,
  TransactionStatus,
  TransactionType,
  Wallet,
  WalletStatus,
} from '@DB/Client';
import { WebhookPayload } from './wallet.types';
import * as Sentry from '@sentry/nestjs';
import { computeCharges } from '@Blithe/common/utils/compute-charges.util';
import { generateTransactionReference } from '@Blithe/common/utils/string.util';
import {
  PrismaService,
  PrismaTransaction,
} from '@Blithe/services/database/prisma.service';
import { EncryptionService } from '@Blithe/services/encryption/encryption.service';
import { BaseLedgerService } from '@Blithe/common/services/base-ledger.service';

@Injectable()
export class WalletService extends BaseLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly accountService: AccountService,
    private readonly encryptionService: EncryptionService,
  ) {
    super('ledger');
  }

  /**
   * Create a wallet for a user if it doesn't already exist
   * @param userId - ID of the user to create wallet for
   * @returns The created wallet or existing wallet if already present
   */
  async create(userId: string) {
    // Get the user
    const user = await this.accountService.findOne(userId);
    if (!user) {
      throw new AppError('User not found');
    }

    // Check if wallet already exists for the user
    const existingWallet = await this.findByUserId(user.id);
    if (existingWallet) {
      return existingWallet;
    }

    // Create a new wallet in Paystack
    const paystackWallet = await this.paystackService.generateWalletAddress({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone as string,
    });

    // Format wallet data
    const createWalletDto: CreateWalletDto = {
      userId: user.id,
      address: paystackWallet.accountNumber,
      name: paystackWallet.accountName,
      tag: paystackWallet.bankName,
      routingNumber: paystackWallet.bankCode,
      balance: '0',
      status: WalletStatus.Active,
    };

    // Create new user wallet
    const newWallet = await this.prisma.ext.wallet.create({
      data: createWalletDto,
      include: { user: true },
    });

    return newWallet;
  }

  /**
   * Retrieve a user's wallet by their user ID
   * @param userId - ID of the user whose wallet is to be retrieved
   * @returns The user's wallet
   */
  async getUserWallet(userId: string) {
    try {
      return await this.findByUserId(userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException('Failed to find wallet', {
        cause: error,
      });
    }
  }

  /**
   * Handle wallet funding webhook events
   * @param webhookData - The webhook payload data
   * @returns A boolean indicating the success of the operation
   */
  async handleWalletFunding(webhookData: WebhookPayload['data']) {
    try {
      // Get the wallet address
      const address = webhookData.authorization.receiver_bank_account_number;

      // Get wallet by address
      const wallet = await this.findByAddress(address);
      if (!wallet) {
        throw new AppError('Wallet not found for the provided address');
      }

      const user = await this.accountService.findOne(wallet.userId);
      if (!user) {
        throw new AppError('User not found for the wallet');
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Debits the user's wallet for funnel pool funding.
   * @param userId The ID of the user whose wallet is to be debited
   * @param debitAmount The amount to debit from the user's wallet
   * @param relatedTranxId The ID of the related transaction for reference
   */
  async debitWalletForFunnelsPoolFunding(
    userId: string,
    debitAmount: Prisma.Decimal,
    relatedTranxId: string,
  ) {
    try {
      const wallet = await this.findByUserId(userId);
      if (!wallet) {
        throw new AppError('Wallet not found for the user');
      }

      // Generate transaction reference
      const reference = generateTransactionReference('TXN');

      // Create transaction dto
      const normalizedDebit = new Prisma.Decimal(debitAmount);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Credit a wallet
   * --------------------
   * When crediting a wallet, make sure that all business rules are followed. Validate ledger entries,
   * ensure idempotency, and log all transactions appropriately.
   * @param address Wallet address
   * @param transactionDto Transaction details
   */
  credit(address: string, transactionDto: any) {
    return this.updateBalance(address, TransactionFlow.Inflow, transactionDto);
  }

  /**
   * Debit a wallet
   * --------------------
   * When debiting a wallet, make sure that all business rules are followed. Validate ledger entries,
   * ensure idempotency, and log all transactions appropriately.
   * @param address Wallet address
   * @param amount Amount to debit
   */
  debit(address: string, transactionDto: any) {
    return this.updateBalance(address, TransactionFlow.Outflow, transactionDto);
  }

  /**
   * Check if wallet has sufficient balance
   * @param address Wallet address
   * @param amount Amount to check
   * @returns boolean indicating if wallet has sufficient balance
   */
  async hasSufficientBalance(address: string, amount: Prisma.Decimal) {
    const wallet = await this.findByAddress(address);
    if (!wallet) {
      throw new AppError('Wallet not found');
    }

    return new Prisma.Decimal(wallet.balance).greaterThanOrEqualTo(amount);
  }

  // =======================================================================================
  // ||                            Internal Methods                                        ||
  // =======================================================================================

  private async updateBalance(
    id_or_address: string,
    flow: TransactionFlow,
    transactionDto: any,
  ) {
    // let wallet = await this.findByAddress(id_or_address);
    // if (!wallet) {
    //   wallet = await this.findOne(id_or_address);
    //   if (!wallet) throw new AppError('Wallet not found');
    // }
    // const netAmount = new Prisma.Decimal(transactionDto.netAmount);
    // const normalizedTransaction: any = {
    //   ...transactionDto,
    //   amount: new Prisma.Decimal(transactionDto.amount),
    //   netAmount,
    //   platformCharges: new Prisma.Decimal(transactionDto.platformCharges ?? 0),
    //   processorCharges: new Prisma.Decimal(
    //     transactionDto.processorCharges ?? 0,
    //   ),
    //   totalCharges: new Prisma.Decimal(transactionDto.totalCharges ?? 0),
    // };
    // return this.prisma.ext.$transaction(
    //   async (tranx) => {
    //     const lockedWallet: Wallet[] =
    //       await tranx.$queryRaw`SELECT * FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;
    //     if (!lockedWallet || lockedWallet.length === 0) {
    //       throw new AppError('Wallet not found during locking');
    //     }
    //     const _wallet = lockedWallet[0];
    //     if (!_wallet) {
    //       throw new AppError('Wallet not found during balance update');
    //     }
    //     const decryptedBalance = this.encryptionService.decrypt(
    //       _wallet.balance,
    //     );
    //     const currentBalance = new Prisma.Decimal(decryptedBalance);
    //     const ledger = await this.validateLedgerConsistency(
    //       tranx as PrismaTransaction,
    //       currentBalance,
    //       _wallet.id,
    //     );
    //     if (!ledger.valid) {
    //       throw new AppError(
    //         'Ledger inconsistency detected. Aborting transaction.',
    //       );
    //     }
    //     const newTransaction =
    //       await this.transactionService.createTransactionWithSession(
    //         tranx as PrismaTransaction,
    //         normalizedTransaction,
    //       );
    //     if (!newTransaction) {
    //       throw new AppError('Failed to create transaction record');
    //     }
    //     let debit = new Prisma.Decimal(0);
    //     let credit = new Prisma.Decimal(0);
    //     switch (flow) {
    //       case TransactionFlow.Inflow:
    //         credit = await this.incrementBalance(
    //           tranx as PrismaTransaction,
    //           wallet.id,
    //           netAmount,
    //           currentBalance,
    //         );
    //         break;
    //       case TransactionFlow.Outflow:
    //         debit = await this.decrementBalance(
    //           tranx as PrismaTransaction,
    //           wallet.id,
    //           netAmount,
    //           currentBalance,
    //         );
    //         break;
    //       default:
    //         throw new AppError('Invalid transaction flow type');
    //     }
    //     const updatedBalance = await this.getBalance(
    //       tranx as PrismaTransaction,
    //       wallet.id,
    //     );
    //     if (!updatedBalance) {
    //       throw new AppError('Failed to retrieve updated wallet balance');
    //     }
    //     const ledgerEntry: CreateLedgerEntryDto = {
    //       walletId: wallet.id,
    //       transactionId: newTransaction.id,
    //       debit,
    //       credit,
    //       balanceBefore: currentBalance,
    //       balanceAfter: new Prisma.Decimal(updatedBalance.balance),
    //       description: newTransaction.reference,
    //     };
    //     const ledgerLog = await this.createLedgerEntry(
    //       tranx as PrismaTransaction,
    //       ledgerEntry,
    //     );
    //     if (!ledgerLog) {
    //       throw new AppError('Failed to log ledger entry');
    //     }
    //     const postLedgerValidation = await this.validateLedgerConsistency(
    //       tranx as PrismaTransaction,
    //       new Prisma.Decimal(updatedBalance.balance),
    //       _wallet.id,
    //     );
    //     if (!postLedgerValidation.valid) {
    //       throw new AppError(
    //         `'Ledger inconsistency detected after transaction. Aborting.': expected balance ${postLedgerValidation.expectedBalance.toNumber()}, actual balance ${postLedgerValidation.actualBalance.toNumber()}`,
    //       );
    //     }
    //     return newTransaction;
    //   },
    //   {
    //     timeout: 20000,
    //   },
    // );
  }

  private getBalance(tranxSession: PrismaTransaction, id: string) {
    return tranxSession.wallet.findFirst({
      where: { id, status: WalletStatus.Active, isDeleted: false },
      select: { balance: true },
    });
  }

  private async incrementBalance(
    tranxSession: PrismaTransaction,
    id: string,
    amount: Prisma.Decimal,
    currentBalance: Prisma.Decimal,
  ) {
    const newBalance = currentBalance.add(amount).toString();
    const updatedBalance = await tranxSession.wallet.update({
      where: { id },
      data: {
        balance: newBalance,
      },
    });
    if (!updatedBalance) {
      throw new AppError('Unable to credit wallet.');
    }

    return amount;
  }

  private async decrementBalance(
    tranxSession: PrismaTransaction,
    id: string,
    amount: Prisma.Decimal,
    currentBalance: Prisma.Decimal,
  ) {
    const newBalance = currentBalance.sub(amount).toString();

    const updatedBalance = await tranxSession.wallet.update({
      where: { id },
      data: {
        balance: newBalance,
      },
    });
    if (!updatedBalance) {
      throw new AppError('Unable to debit wallet.');
    }

    return amount;
  }

  findOne(id: string) {
    return this.prisma.ext.wallet.findFirst({
      where: { id, status: WalletStatus.Active, isDeleted: false },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.ext.wallet.findFirst({
      where: { userId, status: WalletStatus.Active, isDeleted: false },
      include: { user: true },
    });
  }

  findByAddress(address: string) {
    return this.prisma.ext.wallet.findFirst({
      where: { address, status: WalletStatus.Active, isDeleted: false },
    });
  }

  freeze(walletId: string) {
    return this.prisma.ext.wallet.update({
      where: { id: walletId },
      data: { status: WalletStatus.Freezed },
    });
  }

  restore(walletId: string) {
    return this.prisma.ext.wallet.update({
      where: { id: walletId },
      data: { status: WalletStatus.Active },
    });
  }

  suspend(walletId: string) {
    return this.prisma.ext.wallet.update({
      where: { id: walletId },
      data: { status: WalletStatus.Suspended },
    });
  }

  block(walletId: string) {
    return this.prisma.ext.wallet.update({
      where: { id: walletId },
      data: { status: WalletStatus.Blocked },
    });
  }

  delete(walletId: string) {
    return this.prisma.ext.wallet.update({
      where: { id: walletId },
      data: { status: WalletStatus.Deleted },
    });
  }
}
