/**
 * Utility functions for precise percentage calculations
 */

import { Prisma } from '@DB/Client';

/**
 * Calculate X percent of Y.
 * Example: getPercentageOf(10, 250) -> 25
 */
export function getPercentageOf(
  percent: Prisma.Decimal,
  value: Prisma.Decimal,
): Prisma.Decimal {
  return percent.dividedBy(100).times(value);
}

/**
 * Convert a percentage value (e.g. 5%) to its decimal form (0.05)
 * Example: toDecimal(5) -> 0.05
 */
export function toDecimal(percent: number, precision = 6): number {
  return roundTo(percent / 100, precision);
}

/**
 * Convert a decimal value (e.g. 0.05) to its percentage (5)
 * Example: toPercent(0.05) -> 5
 */
export function toPercent(decimal: number, precision = 2): number {
  return roundTo(decimal * 100, precision);
}

/**
 * Helper to round numbers precisely without floating-point artifacts.
 * Uses Number.EPSILON to minimize rounding errors.
 */
export function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Number(
    (((value + Number.EPSILON) * factor) / factor).toFixed(precision),
  );
}
