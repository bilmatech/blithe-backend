import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { TokenService } from './token.service';
import { FirebaseService } from '@sabiflow/common/firebase/firebase.service';
import { AppError } from '@sabiflow/common/utils/error-handler.util';
import { AccountService } from '@sabiflow/account/account.service';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { CreateAccountDto } from '@sabiflow/account/dto/create-account.dto';
import { AccountStatus } from '@DB/Client';
import { NotificationEmitterService } from '@sabiflow/notifications/notification-emitter.service';
import { ApppinService } from '@sabiflow/account/apppin.service';
import { AuthChallengeType } from './auth.type';
import * as Sentry from '@sentry/nestjs';
import { SecurityService } from '@sabiflow/security/security.service';
import { generateDeviceSignature } from '@sabiflow/common/utils/device-signature.util';
import authConfig from './configs/auth.config';
import { ConfigType } from '@nestjs/config';
import { VerificationService } from '@sabiflow/verification/verification.service';
import { Request } from 'express';
import { WalletEmitterService } from '@sabiflow/wallet/wallet-emitter.service';
import appConfig from '@sabiflow/common/config/app.config';
import { FirebaseMessagingService } from '@sabiflow/firebase-messaging/firebase-messaging.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    @Inject(appConfig.KEY)
    private readonly appConfigs: ConfigType<typeof appConfig>,
    private readonly tokenService: TokenService,
    private readonly firebaseService: FirebaseService,
    private readonly accountService: AccountService,
    private readonly appPinService: ApppinService,
    private readonly notificationEmitterService: NotificationEmitterService,
    @Inject(forwardRef(() => SecurityService))
    private readonly securityService: SecurityService,
    private readonly verificationService: VerificationService,
    private readonly walletEmitterService: WalletEmitterService,
    private readonly firebaseMessagingSvc: FirebaseMessagingService,
  ) {}

  /**
   * Create or authorize a user using their Firebase ID token.
   * @param createAuthDto The user create account data
   * @returns The authorized user and their credentials.
   */
  async authorize(createAuthDto: CreateAuthDto, req: Request) {
    try {
      // Gather client info from request
      const clientIp =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
      const userAgent = req.headers['user-agent'] || null;

      // Update DTO with client info
      createAuthDto.deviceInfo.ip = clientIp as string;
      createAuthDto.deviceInfo.userAgent = userAgent as string;

      // Verify the Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(
        createAuthDto.idToken,
      );

      // Get user email
      const email = decodedToken.email as string;
      if (!email) throw new AppError('Invalid user Id token.');

      // The user expected credentials
      const authCredentials: {
        user: any;
        credential: any;
        isNewUser: boolean;
      } = {
        user: null,
        credential: null,
        isNewUser: false,
      };

      // check if the user already exist
      const userExist = await this.accountService.findByEmail(email);
      if (userExist) {
        // Make sure the user is not deleted
        if (
          userExist.accountStatus === AccountStatus.Deleted ||
          userExist.isDeleted
        ) {
          throw new UnauthorizedException(
            this.appConfigs.accountDeletedMessage,
          );
        }

        // Authorize user and issue new access tokens.
        const credential = await this.tokenService.issueTokens(userExist.id);

        // Update user's last seen
        const now = new Date();
        const updatedUser = await this.accountService.update(userExist.id, {
          lastSeen: now,
        });
        // Return the user and their credentials
        authCredentials.user = updatedUser;
        authCredentials.credential = credential;

        if (!(await this.appPinService.hasPin(userExist.id))) {
          // If user does not have an app PIN, set isNewUser to true
          authCredentials.isNewUser = true;
        } else {
          authCredentials.isNewUser = false;
        }
      } else {
        // If user does not exist, create a new user account
        const user = await this.handleUserSignUp(createAuthDto, decodedToken);
        if (!user) throw new AppError('Unable to create user account.');

        // Emit user wallet creation
        await this.walletEmitterService.emitCreateWalletJob(user.id);

        // Emit user created event
        await this.notificationEmitterService.emitUserCreatedEvent(
          `${user.firstName} ${user.lastName}`,
          user.email,
        );

        // Issue access and refresh tokens
        const credential = await this.tokenService.issueTokens(user.id);
        authCredentials.user = user;
        authCredentials.credential = credential;

        authCredentials.isNewUser = true;
      }

      // Validate user device registration
      const deviceSig = this.generateDeviceSignature(createAuthDto.deviceInfo);

      // Get the user existing device
      const currentRegisteredDevice = await this.securityService.getDevice(
        authCredentials.user.id,
      );

      const isTrusted = await this.securityService.isDeviceTrusted(
        authCredentials.user.id,
        deviceSig,
      );

      // If device is not trusted, register it
      if (!currentRegisteredDevice && !isTrusted) {
        await this.securityService.registerDevice({
          userId: authCredentials.user.id,
          deviceSig: deviceSig,
          deviceInfo: createAuthDto.deviceInfo,
          isTrusted: true, // By default, mark new device as trusted
          deviceName: createAuthDto.deviceInfo.deviceName,
          platform: createAuthDto.deviceInfo.platform,
          lastActive: new Date(),
        });
      }

      // if device exist, but not trusted throw an access forbidden error
      if (currentRegisteredDevice && !isTrusted) {
        // Emit verify device event
        await this.verificationService.createDeviceVerification(
          authCredentials.user,
          createAuthDto.deviceInfo,
          'New device sign-in verification',
        );

        // Throw an unauthorized exception
        throw new UnauthorizedException(
          'Access from untrusted device. Please verify your device to continue.',
        );
      }

      // If FCM token is provided, save or update it
      if (createAuthDto.fcmToken) {
        await this.firebaseMessagingSvc.create(
          authCredentials.user.id,
          createAuthDto.fcmToken,
        );
      }

      return authCredentials;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      if (error instanceof UnauthorizedException) {
        throw error;
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
   *  Verify user app PIN and issue a PIN challenge token.
   * @param userId The user Id
   * @param pin The user  app PIN
   */
  async verifyAppPin(userId: string, pin: string) {
    try {
      const isVerified = await this.appPinService.verifyAppPin(
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

  // ---------------------------------------------------------
  // ||                 HELPERS                             ||
  // ---------------------------------------------------------

  /**
   * Handle user sign up by creating a new account.
   * @param createAuthDto The account sign up data
   * @param decodedToken The decoded token
   * @returns The newly sign up user.
   */
  private handleUserSignUp(
    createAuthDto: CreateAuthDto,
    decodedToken: DecodedIdToken,
  ) {
    // Get user info
    const email = decodedToken.email as string;
    const phone = decodedToken.phone_number;
    const names = decodedToken.name || null;
    const picture = decodedToken.picture;

    // format first & last names
    let firstName = undefined;
    let lastName = undefined;
    if (names) {
      const nameParts = names.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
    }

    const createAccountDto: CreateAccountDto = {
      accountType: createAuthDto.accountType,
      accountStatus: AccountStatus.Active,
      firstName,
      lastName,
      phone,
      picture,
      email,
      lastSeen: new Date(),
      // TODO: Implement the referer code validation and pass the referer here.
    };

    return this.accountService.create(createAccountDto);
  }

  /**
   * Generate a device signature based on device info.
   * @param deviceInfo The device information
   * @returns The generated device signature
   */
  generateDeviceSignature(deviceInfo: CreateAuthDto['deviceInfo']) {
    return generateDeviceSignature(
      deviceInfo,
      this.config.deviceSignatureSecret,
    );
  }
}
