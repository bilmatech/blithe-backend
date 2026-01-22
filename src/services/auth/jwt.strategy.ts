import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AccountService } from '@Blithe/account/account.service';
import authConfig from './configs/auth.config';
import { ConfigType } from '@nestjs/config';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import appConfig from '@Blithe/common/config/app.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly accountService: AccountService,
    @Inject(authConfig.KEY)
    private readonly jwtConfig: ConfigType<typeof authConfig>,
    @Inject(appConfig.KEY)
    private readonly appConfigs: ConfigType<typeof appConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.jwtSecret as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    try {
      const user = await this.accountService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException(this.appConfigs.accountDeletedMessage);
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException('Invalid or expired token', {
        cause: error,
      });
    }
  }
}
