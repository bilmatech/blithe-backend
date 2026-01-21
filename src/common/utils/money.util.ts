export type MoneyInput = number | string | bigint;

const SCALE = 2;
const SCALE_FACTOR = 10n ** BigInt(SCALE);

const MONEY_VALUE_REGEX = /^[-+]?\d+(\.\d+)?$/;

function assertFiniteNumber(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid monetary value: value must be a finite number.');
  }
}

function sanitizeString(value: string): string {
  const sanitized = value.replace(/,/g, '').trim();
  if (!MONEY_VALUE_REGEX.test(sanitized)) {
    throw new Error(`Invalid monetary value: "${value}"`);
  }
  return sanitized;
}

function toMinorUnits(value: MoneyInput): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    assertFiniteNumber(value);
    return BigInt(value * Number(SCALE_FACTOR));
  }

  const sanitized = sanitizeString(value);
  const sign = sanitized.startsWith('-') ? -1n : 1n;
  const normalized = sanitized.replace(/^[-+]/, '');
  const [intPartRaw, fractionRaw = ''] = normalized.split('.');
  const intPart = intPartRaw === '' ? '0' : intPartRaw;
  const fraction = (fractionRaw + '0'.repeat(SCALE + 1)).slice(0, SCALE + 1);
  const roundingDigit = Number(fraction[SCALE] ?? '0');
  const fractionalMinor = fraction
    .slice(0, SCALE)
    .padEnd(SCALE, '0')
    .replace(/^\s+$/, '0');

  let minor = BigInt(intPart) * SCALE_FACTOR + BigInt(fractionalMinor || '0');
  if (roundingDigit >= 5) {
    minor += 1n;
  }

  return minor * sign;
}

function minorUnitsToString(minor: bigint): string {
  const sign = minor < 0n ? '-' : '';
  const absolute = minor < 0n ? -minor : minor;
  const units = absolute / SCALE_FACTOR;
  const cents = absolute % SCALE_FACTOR;
  return `${sign}${units.toString()}.${cents.toString().padStart(SCALE, '0')}`;
}

export function normalizeAmount(value: MoneyInput): number {
  const minor = toMinorUnits(value);
  return parseFloat(minorUnitsToString(minor));
}

/**
 * Format amount for encrypted balance.
 * @param value The amount to be formatted
 * @returns The formatted amount.
 */
export function formatAmountForStorage(value: MoneyInput): string {
  return normalizeAmount(value).toFixed(SCALE);
}

export function formatAmountForDisplay(
  value: MoneyInput,
  options: {
    locale?: string;
    currency?: string;
    style?: 'currency' | 'decimal';
  } = {},
): string {
  const { locale = 'en-NG', currency = 'NGN', style = 'currency' } = options;
  const formatter = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: SCALE,
    maximumFractionDigits: SCALE,
  });

  return formatter.format(normalizeAmount(value));
}

export function convertToMinorUnits(value: MoneyInput): bigint {
  return toMinorUnits(value);
}

export function convertFromMinorUnits(value: MoneyInput): number {
  if (typeof value === 'bigint') {
    return parseFloat(minorUnitsToString(value));
  }

  if (typeof value === 'number') {
    assertFiniteNumber(value);
    return parseFloat(minorUnitsToString(BigInt(Math.trunc(value))));
  }

  const sanitized = value.trim();
  if (!/^[-+]?\d+$/.test(sanitized)) {
    throw new Error(
      `Invalid minor unit value: "${value}". Expected an integer string.`,
    );
  }

  return parseFloat(minorUnitsToString(BigInt(sanitized)));
}

export const Money = {
  normalizeAmount,
  formatAmountForStorage,
  formatAmountForDisplay,
  convertToMinorUnits,
  convertFromMinorUnits,
};
