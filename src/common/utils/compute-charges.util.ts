import { normalizeAmount } from './money.util';

/**
 * Compute transaction charges based on a percentage of the amount.
 * @param amount - The transaction amount.
 * @returns The computed charges rounded to two decimal places.
 */
export const computeCharges = (amount: number) => {
  const capped_charges = 70; // in Naira
  const high_amount_threshold = 50000; // 50k threshold
  const high_percentage_charges = 0.6; // 0.6% for amounts > 50k
  const low_percentage_charges = 0.1; // 0.1% for amounts <= 50k

  // Determine percentage based on amount
  const percentage =
    amount > high_amount_threshold
      ? high_percentage_charges
      : low_percentage_charges;

  // Calculate charges
  const calculatedCharges = Math.ceil((percentage * amount) / 100);
  const capped =
    calculatedCharges > capped_charges ? capped_charges : calculatedCharges;

  return normalizeAmount(capped);
};
