import * as crypto from 'crypto';

export function generateDeviceSignature(
  payload: Record<string, any>,
  secret: string,
): string {
  const sorted = Object.keys(payload)
    .sort()
    .reduce((obj, key) => ({ ...obj, [key]: payload[key] }), {});

  const json = JSON.stringify(sorted);
  return crypto.createHmac('sha256', secret).update(json).digest('hex');
}
