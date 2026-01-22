import { Inject, Injectable } from '@nestjs/common';
import authConfig from './configs/auth.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '@sabiflow/common/utils/error-handler.util';
import { AuthChallengeType } from './auth.type';
import { PrismaService } from '@sabiflow/database/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(authConfig.KEY)
    private readonly configs: ConfigType<typeof authConfig>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Issue access and refresh tokens for a user
   * @param userId The user ID
   * @returns The generated access tokens and experiation date with refresh token.
   */
  async issueTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Invalidate any tokens that the user had then before issuing new tokens
    await this.prisma.credential.updateMany({
      where: { userId, isDeleted: false },
      data: { revoked: true },
    });

    // save refresh token in the database
    await this.prisma.credential.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: this.parseExpiryToDate(this.configs.jwtRefreshExpiration),
        revoked: false,
      },
    });

    // The access token expiry date for frontend to use and check if refresh is needed
    const expiresAt = this.parseExpiryToDate(this.configs.jwtExpiration);

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * Rotate tokens by invalidating the old refresh token and issuing new tokens
   * @param oldRefreshToken The old refresh token to be rotated
   * @return The new access and refresh tokens along with their expiration date
   */
  async rotateTokens(oldRefreshToken: string) {
    // Validate the old refresh token
    const existingToken = await this.prisma.credential.findFirst({
      where: { token: oldRefreshToken, isDeleted: false },
    });
    if (!existingToken || existingToken.revoked) {
      throw new AppError('Invalid or revoked refresh token');
    }
    // Validate the token integrity and expiration
    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configs.jwtRefreshSecret,
      });
    } catch (error) {
      // revoke the token if it fails verification
      await this.prisma.credential.updateMany({
        where: { token: oldRefreshToken, isDeleted: false },
        data: { revoked: true },
      });

      throw new AppError('Invalid or expired refresh token');
    }

    const userId = payload.sub;
    if (!userId) {
      throw new AppError('Invalid token payload');
    }

    // Invalidate the old refresh token
    await this.prisma.credential.updateMany({
      where: { token: oldRefreshToken, isDeleted: false },
      data: { revoked: true },
    });

    // Issue new tokens
    const newAccessToken = this.generateAccessToken(userId);
    const newRefreshToken = this.generateRefreshToken(userId);

    // Save the new refresh token in the database
    await this.prisma.credential.create({
      data: {
        userId,
        token: newRefreshToken,
        expiresAt: this.parseExpiryToDate(this.configs.jwtRefreshExpiration),
        revoked: false,
      },
    });

    const expiresAt = this.parseExpiryToDate(this.configs.jwtExpiration);

    return {
      userId,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId The user ID
   * @returns Number of tokens revoked
   */
  async revokeUserTokens(userId: string) {
    return this.prisma.credential.updateMany({
      where: { userId, isDeleted: false },
      data: { revoked: true },
    });
  }

  /**
   * Generate a PIN challenge token
   * @param userId The user ID
   * @returns The challenge token
   */
  public generatePinChallengeToken(userId: string) {
    const payload = { sub: userId, type: AuthChallengeType.APP_PIN };
    const token = this.jwtService.sign(payload, {
      secret: this.configs.jwtPinChallengeSecret,
      expiresIn: this.configs.jwtPinChallengeExpiration,
    });

    const expiresAt = this.parseExpiryToDate(
      this.configs.jwtPinChallengeExpiration,
    );

    return { token, expiresAt };
  }

  /**
   * Verifies a PIN challenge token and returns the decoded payload.
   * @param token The challenge token to verify
   * @returns The decoded token payload
   */
  public verifyPinChallengeToken(token: string) {
    try {
      const payload: { sub: string; type: AuthChallengeType } =
        this.jwtService.verify(token, {
          secret: this.configs.jwtPinChallengeSecret,
        });

      return payload;
    } catch (error) {
      throw new AppError('Invalid or expired PIN challenge token');
    }
  }

  // =======================================================================================================
  // ||                                       HELPERS METHODS                                             ||
  // =======================================================================================================

  /**
   * Generate a JWT access token
   * @param userId The user ID to include in the token payload
   * @returns The signed JWT access token
   */
  private generateAccessToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      secret: this.configs.jwtSecret,
      expiresIn: this.configs.jwtExpiration,
    });
  }

  /**
   * Generate a JWT refresh token
   * @param userId The user ID to include in the token payload
   * @returns The signed JWT refresh token
   */
  private generateRefreshToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      secret: this.configs.jwtRefreshSecret,
      expiresIn: this.configs.jwtRefreshExpiration,
    });
  }

  /**
   * Converts JWT expiration string (e.g., '7d', '24h', '30m', '60s') to milliseconds
   * @param expiryString - The expiry string from JWT config (e.g., '7d', '24h', '30m', '60s')
   * @returns The expiry time in milliseconds
   */
  private parseExpiryToMillis(expiryString: string): number {
    // Remove any whitespace
    const cleanExpiry = expiryString.trim();

    // Extract the numeric part and the unit
    const match = cleanExpiry.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(
        `Invalid expiry format: ${expiryString}. Expected format: '7d', '24h', '30m', or '60s'`,
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    // Convert to milliseconds based on unit
    switch (unit) {
      case 's': // seconds
        return value * 1000;
      case 'm': // minutes
        return value * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(
          `Unsupported time unit: ${unit}. Supported units: s, m, h, d`,
        );
    }
  }

  /**
   * Converts JWT expiration string to a future Date object
   * @param expiryString - The expiry string from JWT config (e.g., '7d', '24h', '30m', '60s')
   * @returns A Date object representing when the token expires
   */
  private parseExpiryToDate(expiryString: string): Date {
    const milliseconds = this.parseExpiryToMillis(expiryString);
    return new Date(Date.now() + milliseconds);
  }
}
