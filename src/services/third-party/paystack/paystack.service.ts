import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import thirdPartyConfig from '../config/third-party.config';
import {
  Customers,
  DedicatedVirtualAccounts,
  Miscellaneous,
  Transfer,
  Verification,
  TransferRecipients,
  Currencies,
} from '@obipascal/paystack-sdk';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { VerifyAccountNumberDto } from './dto/verify-account-number.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreatePaystackRecipientDto } from './dto/create-paystack-recipient.dto';
import { Prisma } from '@DB/Client';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { generateTransactionReference } from '@Blithe/common/utils/string.util';

@Injectable()
export class PaystackService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private readonly config: ConfigType<typeof thirdPartyConfig>,
  ) {}

  /**
   *  Generate Wallet Address, which involves creating a customer and then a virtual account
   * @param createCustomerDto The customer info
   * @returns The new wallet address
   */
  async generateWalletAddress(createCustomerDto: CreateCustomerDto) {
    // create a customer first
    const customerId = await this.createCustomer(createCustomerDto);

    // create a virtual account
    const virtualAccount = new DedicatedVirtualAccounts(
      this.config.paystack.paystackSecretKey,
    );
    const newVirtualAccount = await virtualAccount.create({
      customer: customerId.toString(),
      preferred_bank: this.config.wallet.bankSlug,
    });

    if (!newVirtualAccount?.status) {
      throw new AppError('Error creating wallet address.');
    }

    return {
      accountNumber: newVirtualAccount.data.account_number,
      accountName: newVirtualAccount.data.account_name,
      bankName: this.config.wallet.bankName,
      bankCode: this.config.wallet.bankCode,
    };
  }

  /**
   * List Banks Supported by Paystack
   * @returns The list of banks
   */
  async listBanks() {
    try {
      const miscellaneous = new Miscellaneous(
        this.config.paystack.paystackSecretKey,
      );

      const banks = await miscellaneous.banks({ country: 'nigeria' });
      if (!banks?.status) {
        throw new AppError('Error fetching banks list');
      }

      return banks.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        'Failed to verify account number',
        { cause: error },
      );
    }
  }

  /**
   * Verify Account Number with Paystack
   * @param verifyAccountDto The account info
   * @returns The account details
   */
  async verifyAccountNumber(verifyAccountDto: VerifyAccountNumberDto) {
    try {
      const verification = new Verification(
        this.config.paystack.paystackSecretKey,
      );

      // if development environment, return mock data
      if (this.config.env === 'development') {
        return {
          account_name: 'John Doe - Test Account',
          account_number: '0000000000',
          bank_id: 123,
          bank_code: '057',
        };
      }

      const result = await verification.resolveAccount({
        account_number: verifyAccountDto.accountNumber,
        bank_code: verifyAccountDto.bankCode,
      });

      if (!result?.status) {
        throw new AppError('Error verifying account number');
      }

      return {
        account_name: result.data.account_name,
        account_number: result.data.account_number,
        bank_id: result.data.bank_id,
        bank_code: verifyAccountDto.bankCode,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        'Failed to verify account number',
        { cause: error },
      );
    }
  }

  /**
   * Transfer funds to a recipient
   * @param transferDto The transfer details
   * @returns The transfer transaction details
   */
  async sendFunnelFunds(transferDto: TransferDto) {
    if (!transferDto.reference) {
      transferDto.reference = generateTransactionReference('BLTTXN');
    }

    // Valdiation: if the recipient code is present, proceed to transfer funds other wise create recipient first
    if (transferDto.recipientCode) {
      return this.sendMoney(
        transferDto.amount,
        transferDto.recipientCode,
        transferDto.reference,
        transferDto.desc,
      );
    }

    const newRecipientCode = await this.createRecipient({
      name: transferDto.name as string,
      accountNumber: transferDto.accountNumber as string,
      bankCode: transferDto.bankCode as string,
    });
    return this.sendMoney(
      transferDto.amount,
      newRecipientCode,
      transferDto.reference,
      transferDto.desc,
    );
  }

  /**
   * Create a transfer recipient
   * @param createRecipientDto The transfer details
   * @returns The recipient code
   */
  async createRecipient(createRecipientDto: CreatePaystackRecipientDto) {
    const transferRecipientSvc = new TransferRecipients(
      this.config.paystack.paystackSecretKey,
    );

    if (
      !createRecipientDto.name ||
      !createRecipientDto.accountNumber ||
      !createRecipientDto.bankCode
    ) {
      throw new AppError('Insufficient data to create transfer recipient');
    }

    const newRecipient = await transferRecipientSvc.create({
      type: 'nuban',
      name: createRecipientDto.name,
      account_number: createRecipientDto.accountNumber,
      bank_code: createRecipientDto.bankCode,
      currency: Currencies.NGN,
    });

    if (!newRecipient?.status) {
      throw new AppError('Error creating transfer recipient');
    }

    return newRecipient.data.recipient_code;
  }

  /**
   * Send Money to Recipient
   * @param sendAmount The amount to send
   * @param recipientCode The recipient code
   * @param desc The transfer description
   * @returns The transfer transaction details
   */
  async sendMoney(
    sendAmount: Prisma.Decimal,
    recipientCode: string,
    reference: string = generateTransactionReference('TRF'),
    desc?: string,
  ) {
    const transferSvc = new Transfer(this.config.paystack.paystackSecretKey);

    const newTransfer = await transferSvc.initiate({
      source: 'balance',
      amount: sendAmount.toNumber() * 100, // convert to kobo
      recipient: recipientCode,
      reason: desc ? desc : 'Wallet Transfer',
      reference,
    });

    if (!newTransfer?.status) {
      return { transaction: null, recipient: null };
    }

    return {
      transaction: newTransfer.data,
      recipient: recipientCode,
    };
  }

  // =============================================================================================================
  // ||                                     HELPERS METHODS                                                     ||
  // =============================================================================================================

  /** Create Paystack Customer
   * @param createCustomerDto
   * @returns Paystack Customer ID
   */
  private async createCustomer(createCustomerDto: CreateCustomerDto) {
    // initalize paystack service
    const customerResource = new Customers(
      this.config.paystack.paystackSecretKey,
    );

    // create a customer
    const newCustomer = await customerResource.create({
      email: createCustomerDto.email,
      first_name: createCustomerDto.firstName,
      last_name: createCustomerDto.lastName,
      phone: createCustomerDto.phone,
    });
    if (!newCustomer?.status) throw new AppError(`Error creating customer`);

    return newCustomer.data.id;
  }
}
