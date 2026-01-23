import { Prisma } from '@DB/Client';

export class CreateLedgerEntryDto {
  walletId: string;
  transactionId: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  balanceBefore: Prisma.Decimal;
  balanceAfter: Prisma.Decimal;
  description?: string;
}
