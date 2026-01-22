import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtExpiration: process.env.JWT_ACCESS_EXPIRY || '15m', // 15 minutes
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days
  jwtPinChallengeSecret: process.env.JWT_PIN_CHALLENGE_SECRET,
  jwtPinChallengeExpiration: '5m', // 5 minutes
  deviceSignatureSecret: process.env.DEVICE_SIGNATURE_SECRET as string,
}));
