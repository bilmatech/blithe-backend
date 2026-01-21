import { Prisma } from '@DB/Client';
import { formatAmountForStorage, normalizeAmount } from './money.util';

/**
 * Generates a unique code by appending a random alphanumeric string to the given prefix.
 * @param prefix  The prefix for the unique code
 * @param length  The length of the random alphanumeric string (default is 10)
 * @returns  The generated unique code
 */
export function generateUniqueCode(
  prefix: string,
  length: number = 10,
): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

/**
 * Calculates Paystack transfer fee and net amount for Nigeria.
 *
 * @param amount The gross amount you intend to transfer (in NGN).
 * @returns An object with { amount, charge, netAmount }.
 */
export function calculatePaystackTransfer(amount: Prisma.Decimal): {
  /**
   * The gross amount to be transferred.
   */
  tranxAmount: Prisma.Decimal;
  /**
   * The fee charged by Paystack for the transfer.
   */
  tranxCharge: Prisma.Decimal;
  /**
   * The net amount that will be debited from the wallet after adding the charge.
   */
  debitAmount: Prisma.Decimal;
} {
  if (amount.lessThan(0)) {
    throw new Error('Amount must be non-negative');
  }

  let charge: Prisma.Decimal;

  if (amount.lessThanOrEqualTo(5000)) {
    charge = new Prisma.Decimal(10);
  } else if (amount.lessThanOrEqualTo(50000)) {
    charge = new Prisma.Decimal(25);
  } else {
    charge = new Prisma.Decimal(50);
  }

  const netAmount = new Prisma.Decimal(amount).add(charge);

  return { tranxAmount: amount, tranxCharge: charge, debitAmount: netAmount };
}

/**
 * Masks an email address for security purposes.
 * Shows the first 2 characters and the domain, hiding the middle part.
 * @param email The email address to mask
 * @returns The masked email address
 * @example maskEmail("john.doe@example.com") returns "jo***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email address');
  }

  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    throw new Error('Invalid email format');
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);

  if (localPart.length <= 2) {
    return `${localPart[0]}***${domain}`;
  }

  const visibleChars = localPart.substring(0, 2);
  return `${visibleChars}***${domain}`;
}

export function formatAmountToString(amount: string | number): string {
  return formatAmountForStorage(amount);
}

export function formatAmountToNumber(amount: string | number): number {
  return normalizeAmount(amount);
}
