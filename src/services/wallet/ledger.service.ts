import { Injectable } from '@nestjs/common';
import { CreateLedgerEntryDto } from '../common/dto/create-ledger-entry.dto';
import { PrismaTransaction } from '@Blithe/database/prisma.service';
import { TransactionType } from '@DB/Client';
import { BaseLedgerService } from '@Blithe/common/services/base-ledger.service';

@Injectable()
export class LedgerService extends BaseLedgerService {
  constructor() {
    super('ledger');
  }

  async recordTransaction(
    tranx: PrismaTransaction,
    type: TransactionType,
    createLedgerEntryDto: CreateLedgerEntryDto,
  ) {
    // Record the ledger entry
    switch (type) {
      case TransactionType.Deposit:
        return await this.logCreditEntry(tranx, createLedgerEntryDto);

      case TransactionType.Transfer:
        return await this.logDebitEntry(tranx, createLedgerEntryDto);

      default:
        return false;
    }
  }
}
