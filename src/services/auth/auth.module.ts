import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigType } from '@nestjs/config';
import authConfig from './configs/auth.config';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { NotificationModule } from '../notifications/notification.module';
import { AccountModule } from '../account/account.module';
import { EncryptionModule } from '../encryption/encryption.module';
import appConfig from '@Blithe/common/config/app.config';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    ConfigModule.forFeature(appConfig),
    // Configure the JWT module with the secret and expiration time
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.jwtSecret as string,
        signOptions: { expiresIn: config.jwtExpiration },
      }),
      inject: [authConfig.KEY],
    }),
    NotificationModule,
    AccountModule,
    EncryptionModule,
    VerificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService],
  exports: [JwtModule, AuthService, TokenService],
})
export class AuthModule {}
