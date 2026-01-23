import * as Sentry from '@sentry/nestjs';
import { Prisma } from '@DB/Client';
import { PrismaTransaction } from '@Blithe/services/database/prisma.service';
import { CreateLedgerEntryDto } from '../dto/create-ledger-entry.dto';

type LedgerTable = 'ledger' | 'funnelPoolLedger';

/**
 * Shared ledger helper that encapsulates ledger entry deduplication, inserts,
 * and lightweight consistency checks. The same helper is reused by the wallet
 * and funnel pool domains, so it is optimized for low allocation overhead and
 * simpler extensibility when new ledger tables are introduced.
 */
export class BaseLedgerService {
  constructor(private readonly tableName: LedgerTable) {}

  async createLedgerEntry(
    tranx: PrismaTransaction,
    createLedgerEntryDto: CreateLedgerEntryDto,
  ) {
    const repository = this.getLedgerDelegate(tranx);

    const existingEntry = await repository.findFirst({
      where: {
        transactionId: createLedgerEntryDto.transactionId,
        isDeleted: false,
      },
    });
    if (existingEntry) {
      return existingEntry;
    }

    return repository.create({ data: createLedgerEntryDto });
  }

  logDebitEntry(
    tranx: PrismaTransaction,
    createLedgerEntryDto: CreateLedgerEntryDto,
  ) {
    return this.createLedgerEntry(tranx, createLedgerEntryDto);
  }

  logCreditEntry(
    tranx: PrismaTransaction,
    createLedgerEntryDto: CreateLedgerEntryDto,
  ) {
    return this.createLedgerEntry(tranx, createLedgerEntryDto);
  }

  async validateLedgerConsistency(
    tranx: PrismaTransaction,
    balance: Prisma.Decimal,
    id: string,
  ) {
    const repository = this.getLedgerDelegate(tranx);
    const whereClause =
      this.tableName === 'ledger'
        ? { walletId: id, isDeleted: false }
        : { poolId: id, isDeleted: false };

    const ledgerSummary = await repository.aggregate({
      where: whereClause,
      _sum: { credit: true, debit: true },
    });

    const totalCredits: Prisma.Decimal =
      ledgerSummary._sum.credit ?? new Prisma.Decimal(0);
    const totalDebits: Prisma.Decimal =
      ledgerSummary._sum.debit ?? new Prisma.Decimal(0);
    const expectedBalance: Prisma.Decimal =
      totalCredits?.sub(totalDebits) ?? new Prisma.Decimal(0);
    const actualBalance = balance;

    if (!expectedBalance.equals(actualBalance)) {
      Sentry.logger.fatal(
        `Ledger inconsistency detected: ExpectedBalance=${expectedBalance.toNumber()}; ActualBalance=${actualBalance.toNumber()}`,
        { action: 'validateLedgerConsistency', table: this.tableName },
      );
      return { valid: false, expectedBalance, actualBalance };
    }

    return { valid: true, expectedBalance, actualBalance };
  }

  private getLedgerDelegate(tranx: PrismaTransaction) {
    return tranx[this.tableName] as any;
  }
}
