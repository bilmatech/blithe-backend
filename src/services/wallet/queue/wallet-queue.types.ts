import { CreditWalletPayload, WebhookPayload } from '../wallet.types';

export enum WalletEvents {
  CREATE_WALLET = 'create_wallet',
  FUND_WALLET = 'fund_wallet',
  DEBIT_WALLET = 'debit_wallet',
  CREDIT_WALLET = 'credit_wallet',
  HANDLE_TRANSFER_SUCCESS = 'handle_transfer_success',
  HANDLE_TRANSFER_REVERSAL = 'handle_transfer_reversal',
}

export type WalletJobPayload = {
  /** Wallet job payload(s) */
  payload: string | WebhookPayload | CreditWalletPayload;
};
