import { Prisma } from '@DB/Client';

export class TransferDto {
  reference?: string;
  recipientCode?: string;
  name?: string;
  accountNumber?: string;
  bankCode?: string;
  amount: Prisma.Decimal;
  desc?: string;
  metadata?: Record<string, any>;
}
