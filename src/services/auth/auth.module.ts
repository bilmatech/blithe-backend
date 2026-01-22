import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigType } from '@nestjs/config';
import authConfig from './configs/auth.config';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { NotificationsModule } from '@sabiflow/notifications/notifications.module';
import { SecurityModule } from '@sabiflow/security/security.module';
import { VerificationModule } from '@sabiflow/verification/verification.module';
import { WalletModule } from '@sabiflow/wallet/wallet.module';
import appConfig from '@sabiflow/common/config/app.config';
import { PinChallengeGuard } from './guards/pin-challenge.guard';
import { FirebaseModule } from '@sabiflow/common/firebase/firebase.module';
import { FirebaseMessagingModule } from '@sabiflow/firebase-messaging/firebase-messaging.module';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    ConfigModule.forFeature(appConfig),
    AccountModule,
    // Configure the JWT module with the secret and expiration time
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiration },
      }),
      inject: [authConfig.KEY],
    }),
    NotificationsModule,
    forwardRef(() => SecurityModule),
    VerificationModule,
    WalletModule,
    FirebaseModule,
    FirebaseMessagingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, PinChallengeGuard],
  exports: [JwtModule, AuthService, TokenService, PinChallengeGuard],
})
export class AuthModule {}
