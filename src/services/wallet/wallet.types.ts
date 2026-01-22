import { TransactionDto } from '@Blithe/transaction/dto/transaction.dto';

export interface WebhookPayload {
  event: WebhookEvent;
  data: WebhookData;
}

export interface CreditWalletPayload {
  walletAddress: string;
  transaction: TransactionDto;
}

export interface WebhookData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string | null;
  metadata: WebhookMetadata;
  fees_breakdown: any;
  log: any;
  fees: number;
  fees_split: any;
  authorization: WebhookAuthorization;
  customer: WebhookCustomer;
  plan: Record<string, any>;
  subaccount: Record<string, any>;
  split: Record<string, any>;
  order_id: string | null;
  paidAt: string;
  requested_amount: number;
  pos_transaction_data: any;
  source: any;
}

export interface WebhookMetadata {
  receiver_account_number: string;
  receiver_bank: string;
  receiver_account_type: string | null;
  custom_fields: WebhookCustomField[];
}

export interface WebhookCustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

export interface WebhookAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string | null;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string | null;
  account_name: string | null;
  sender_country: string;
  sender_bank: string | null;
  sender_bank_account_number: string;
  sender_name?: string;
  narration?: string;
  receiver_bank_account_number: string;
  receiver_bank: string;
}

export interface WebhookCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string;
  metadata: Record<string, any>;
  risk_action: string;
  international_format_phone: string | null;
}

export enum WebhookEvent {
  CHARGE_DISPUTE_CREATE = 'charge.dispute.create',
  CHARGE_DISPUTE_REMIND = 'charge.dispute.remind',
  CHARGE_DISPUTE_RESOLVE = 'charge.dispute.resolve',
  CHARGE_SUCCESS = 'charge.success',
  CUSTOMER_IDENTIFICATION_FAILED = 'customeridentification.failed',
  CUSTOMER_IDENTIFICATION_SUCCESS = 'customeridentification.success',
  DEDICATED_ACCOUNT_ASSIGN_FAILED = 'dedicatedaccount.assign.failed',
  DEDICATED_ACCOUNT_ASSIGN_SUCCESS = 'dedicatedaccount.assign.success',
  INVOICE_CREATE = 'invoice.create',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_UPDATE = 'invoice.update',
  PAYMENT_REQUEST_PENDING = 'paymentrequest.pending',
  PAYMENT_REQUEST_SUCCESS = 'paymentrequest.success',
  REFUND_FAILED = 'refund.failed',
  REFUND_PENDING = 'refund.pending',
  REFUND_PROCESSED = 'refund.processed',
  REFUND_PROCESSING = 'refund.processing',
  SUBSCRIPTION_CREATE = 'subscription.create',
  SUBSCRIPTION_DISABLE = 'subscription.disable',
  SUBSCRIPTION_EXPIRING_CARDS = 'subscription.expiring_cards',
  SUBSCRIPTION_NOT_RENEW = 'subscription.not_renew',
  TRANSFER_FAILED = 'transfer.failed',
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_REVERSED = 'transfer.reversed',
}
