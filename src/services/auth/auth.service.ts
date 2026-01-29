import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { TokenService } from './token.service';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { AccountStatus, UserType, VerificationType } from '@DB/Client';
import { AuthChallengeType } from './auth.type';
import * as Sentry from '@sentry/nestjs';
import { VerificationService } from '@Blithe/services/verification/verification.service';
import { AccountService } from '../account/account.service';
import { CredentialsService } from '../account/credentials.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerificationCodeDto } from '../account/dto/verificaiton-code.dto';
import { NotificationType } from '../notifications/queue/notification.queue';
import { ResendCodeDto } from './dto/resend-code.dto';
import { maskEmail } from '@Blithe/common/utils/funcs.util';
import { EncryptionService } from '../encryption/encryption.service';
import { ResetPasswordDto } from '../account/dto/reset-password.dto';
import { AuthorizeUserDto, SourceType } from './dto/authorize-user.dto';
import { WalletEnqueueService } from '../wallet/queue/wallet-enqueue.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly accountService: AccountService,
    private readonly credentialsService: CredentialsService,
    private readonly verificationService: VerificationService,
    private readonly encryptionService: EncryptionService,
    private readonly walletEnqueueService: WalletEnqueueService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Create a new user account along with credentials and send verification code.
   * @param createAccountDto Data transfer object containing user account details
   * @param type The type of user account to create
   * @returns The newly created user account
   */
  async createAccount(createAccountDto: CreateAuthUserDto, type: UserType) {
    try {
      const newUser = await this.accountService.create(createAccountDto, type);

      // Create user credentials
      await this.credentialsService.setPassword(
        newUser.id,
        createAccountDto.password,
      );

      // Send verification code
      await this.verificationService.sendVerificationCode(
        newUser.id,
        newUser.email,
        VerificationType.account_activation,
        NotificationType.AccountVerification,
      );

      return newUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Resend account verification code to the user's email.
   * @param resendCodeDto The DTO containing the user's email
   * @return A message indicating that the new verification code has been sent
   */
  async resendAccountVerificationCode(resendCodeDto: ResendCodeDto) {
    try {
      const account = await this.accountService.findByEmail(
        resendCodeDto.email,
      );
      if (!account) {
        throw new AppError(
          'Sorry, we could not find an account with that email address.',
        );
      }

      // if email verified, no need to resend code
      if (account.verifiedAt) {
        throw new AppError('This account is already verified.');
      }

      // Send verification code
      await this.verificationService.sendVerificationCode(
        account.id,
        account.email,
        VerificationType.account_activation,
        NotificationType.AccountVerification,
      );

      return {
        message: `A new verification code has been sent to ${maskEmail(account.email)}`,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Verify user account using the provided verification code.
   * @param verificationCodeDto The verification code sent to the user
   * @returns Auth tokens and user information upon successful verification
   */
  async verifyAccount(verificationCodeDto: VerificationCodeDto) {
    try {
      // Verify user account and generate tokens
      const verification = await this.verificationService.verifyCode(
        verificationCodeDto.code,
      );
      if (!verification.valid) throw new AppError('Invalid verification code.');

      // Update user account status to active
      await this.accountService.verifiedEmail(verification.user.id);

      // Generate auth tokens
      const tokenInfo = await this.tokenService.issueTokens(
        verification.user.id,
      );

      // TODO: Initialize other user account services here (e.g., wallet)
      if (verification.user.type === UserType.guardian) {
        // Create user wallet
        await this.walletEnqueueService.createWallet(verification.user.id);
      }

      return { tokens: tokenInfo, user: verification.user };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Initiate the forgot password process by sending a reset code to the user's email.
   * @param forgotPasswordDto The DTO containing the user's email
   * @returns A message indicating that the reset code has been sent
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      // Verify that the email exists
      const account = await this.accountService.findByEmail(
        forgotPasswordDto.email,
      );
      if (!account) {
        throw new AppError(
          'Sorry, we could not find an account with that email address.',
        );
      }

      // Send password reset verification code
      await this.verificationService.sendVerificationCode(
        account.id,
        account.email,
        VerificationType.password_reset,
        NotificationType.ForgotPassword,
      );

      return `A reset code has been sent to ${maskEmail(account.email)}`;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Resend the password reset code to the user's email.
   * @param resendCodeDto The DTO containing the user's email
   * @returns A message indicating that the new reset code has been sent
   */
  async resendPasswordResetCode(resendCodeDto: ResendCodeDto) {
    try {
      const account = await this.accountService.findByEmail(
        resendCodeDto.email,
      );
      if (!account) {
        throw new AppError(
          'Sorry, we could not find an account with that email address.',
        );
      }

      // Send password reset verification code
      await this.verificationService.sendVerificationCode(
        account.id,
        account.email,
        VerificationType.password_reset,
        NotificationType.ForgotPassword,
      );

      return `A new reset code has been sent to ${maskEmail(account.email)}`;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Verify the password reset code and issue a reset token.
   * @param verificationCodeDto The DTO containing the reset code
   * @returns A reset token valid for a limited time
   */
  async verifyPasswordResetCode(verificationCodeDto: VerificationCodeDto) {
    try {
      // Verify password reset code
      const verification = await this.verificationService.verifyCode(
        verificationCodeDto.code,
      );
      if (!verification.valid) throw new AppError('Invalid verification code.');

      // Reset token expires after 10 minutes delay
      const resetTokenExpiresAt = new Date();
      resetTokenExpiresAt.setMinutes(resetTokenExpiresAt.getMinutes() + 10);

      const resetToken = this.encryptionService.encrypt(
        JSON.stringify({
          userId: verification.user.id,
          code: verificationCodeDto.code,
          expiresAt: resetTokenExpiresAt.toISOString(),
        }),
      );

      return resetToken;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Reset user password using the provided reset token and new password.
   * @param resetPasswordDto The DTO containing the reset token and new password
   * @returns A message indicating successful password reset
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { token, newPassword } = resetPasswordDto;

      // Decrypt and validate reset token
      const decryptedToken = this.encryptionService.decrypt(token);
      const { userId, code, expiresAt } = JSON.parse(decryptedToken);

      // User must have verified the reset code before resetting password
      const verification = await this.verificationService.findOne(code);
      if (!verification || verification.used == false) {
        throw new AppError(
          'Sorry, kindly verify the reset code before resetting password.',
        );
      }

      // Check if reset token has expired
      if (new Date(expiresAt) < new Date()) {
        throw new AppError(
          'Reset token has expired. Please restart the password reset process.',
        );
      }

      // Update user password
      await this.credentialsService.setPassword(userId, newPassword);

      return 'Password has been reset successfully.';
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Refresh access token using a valid refresh token.
   * @param refreshToken The refresh token from user
   * @returns the new refreshed and access token
   */
  async refresh(refreshToken: string) {
    try {
      const tokenInfo = await this.tokenService.rotateTokens(refreshToken);
      if (!tokenInfo) throw new AppError('Invalid refresh token.');

      return tokenInfo;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Logout user by revoking their refresh token.
   * @param refreshToken The refresh token to be revoked
   * @returns void
   */
  async logout(refreshToken: string) {
    try {
      await this.tokenService.revokeUserTokens(refreshToken);
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   *  Verify user PIN and issue a PIN challenge token.
   * @param userId The user Id
   * @param pin The user  app PIN
   */
  async verifyPin(userId: string, pin: string) {
    try {
      const isVerified = await this.credentialsService.verifyPin(
        userId,
        pin.toString(),
      );
      if (!isVerified) throw new AppError('Invalid app pin.');

      // Generate a pin challenge token
      const pinChallengeToken =
        this.tokenService.generatePinChallengeToken(userId);

      return {
        userId,
        XPinChallengeToken: pinChallengeToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException('Internal server error', {
        cause: error,
      });
    }
  }

  /**
   * Validate a PIN challenge token for a user.
   * @param userId The user ID
   * @param token The PIN challenge token to validate
   * @returns True if the token is valid and belongs to the user, otherwise false
   */
  verifyPinChallengeToken(userId: string, token: string) {
    try {
      const payload = this.tokenService.verifyPinChallengeToken(token);

      if (payload.type !== AuthChallengeType.APP_PIN) {
        throw new UnauthorizedException('Invalid PIN challenge token type');
      }

      if (payload.sub !== userId) {
        throw new UnauthorizedException('User ID does not match token subject');
      }

      return true;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Authorize user by verifying email and password, then issue auth tokens.
   * @param authorizedUserDto The DTO containing user email and password
   * @returns Auth tokens and user information upon successful authorization
   */
  async authorize(authorizedUserDto: AuthorizeUserDto) {
    try {
      // Find the user by email
      const user = await this.accountService.findByEmail(
        authorizedUserDto.email,
      );
      if (!user) {
        throw new AppError('Invalid email or password.');
      }

      // Validation: Make sure the user attempting to login from allowed source
      // e.g., a school user should not login from mobile app
      if (
        user.type === UserType.school &&
        authorizedUserDto.source === SourceType.MOBILE
      ) {
        throw new AppError(
          'Sorry, your account is not permitted to login from mobile app.',
        );
      }

      if (
        user.type === UserType.guardian &&
        authorizedUserDto.source === SourceType.WEB
      ) {
        throw new AppError(
          'Sorry, your account is not permitted to login from web.',
        );
      }

      // Validation: If user is not verified, send verification code again.
      if (!user.verifiedAt) {
        // Send verification code
        await this.verificationService.sendVerificationCode(
          user.id,
          user.email,
          VerificationType.account_activation,
          NotificationType.AccountVerification,
        );

        // just return the user information
        return {
          user,
          message:
            'Your account is not verified. A new verification code has been sent to your email.',
        };
      }

      // Validation: Check if the user account is closed
      if (
        [
          AccountStatus.blocked,
          AccountStatus.suspended,
          AccountStatus.deleted,
        ].some((status) => status === user.accountStatus)
      ) {
        throw new AppError(
          `Your account is currently ${user.accountStatus}. Please contact support for assistance.`,
        );
      }

      // Verify the user's password
      const isPasswordValid = await this.credentialsService.verifyPassword(
        user.id,
        authorizedUserDto.password,
      );
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password.');
      }

      // update user last login timestamp
      await this.accountService.updateLoginTimestamp(user.id);

      // Generate new user tokens
      const tokenInfo = await this.tokenService.issueTokens(user.id);

      return { tokens: tokenInfo, user };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  // ---------------------------------------------------------
  // ||                 HELPERS                             ||
  // ---------------------------------------------------------
}
