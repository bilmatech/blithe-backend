export class CreateWalletTransactionDto {
  walletId: string;
  amount: number;
  fees: number;
  reference?: string;
  desc?: string;
}
