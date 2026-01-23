export enum PushMessageType {
  WALLET_CREATED = 'WALLET_CREATED',
  WALLET_FUNDED = 'WALLET_FUNDED',
  WALLET_TRANSACTION = 'WALLET_TRANSACTION',
  FUNNEL_POOL_CREDITED = 'FUNNEL_POOL_CREDITED',
  FUNNEL_POOL_WITHDRAWAL_INITIATED = 'FUNNEL_POOL_WITHDRAWAL_INITIATED',
  FUNNEL_WITHDRAWAL_INITIATED = 'FUNNEL_WITHDRAWAL_INITIATED',
  FUNNEL_DELETED = 'FUNNEL_DELETED',
}

export type WalletCreated = {
  name: string;
  address: string;
  tag: string;
  routingNumber: string;
};

export type TransactionData = {
  amount: number;
  formattedAmount: string;
  transactionId: string;
  type: 'credit' | 'debit';
};

export type WalletFunded = {
  amount: number;
  formattedAmount: string;
  transactionId: string;
};

export type WalletTransaction = TransactionData;

export type FunnelPoolCredited = TransactionData;

export type FunnelPoolWithdrawalInitiated = TransactionData;
export type FunnelWithdrawalInitiated = TransactionData;
export type FunnelDeleted = {
  funnelId: string;
  name: string;
};

export type PushMessageDataDto = {
  type: PushMessageType;
  wallet?: WalletCreated;
  funding?: WalletFunded;
  transaction?: WalletTransaction;
  funnelPoolCredited?: FunnelPoolCredited;
  funnelPoolWithdrawalInitiated?: FunnelPoolWithdrawalInitiated;
  funnelWithdrawalInitiated?: FunnelWithdrawalInitiated;
  funnelDeleted?: FunnelDeleted;
};

export class PushMessageDto {
  title: string;
  body: string;
  data?: PushMessageDataDto;
}
