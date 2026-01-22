import { WalletStatus } from '@DB/Client';

export class CreateWalletDto {
  address: string;
  userId: string;
  name: string;
  tag: string;
  routingNumber: string;
  balance: string;
  status?: WalletStatus;
}
