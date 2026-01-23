import { registerAs } from '@nestjs/config';

export default registerAs('thirdParty', () => ({
  env: process.env.NODE_ENV || 'development',
  /** Paystack config */
  paystack: {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  },

  /** Wallet configurations */
  wallet: {
    bankCode: process.env.WALLET_BANK_CODE || '',
    bankName: process.env.WALLET_BANK_NAME || '',
    bankSlug: process.env.WALLET_BANK_SLUG || '',
  },
}));
