// src/common/guards/pin-challenge.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthUser } from '../auth.type';

@Injectable()
export class PinChallengeGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ user: AuthUser; headers: Headers }>();
    const header = this.extractHeader(req.headers);
    const user = req.user; // provided by JwtAuthGuard

    if (!user?.id) {
      throw new UnauthorizedException('User not resolved from access token');
    }
    if (!header) {
      throw new ForbiddenException('PIN challenge header missing');
    }

    return this.authService.verifyPinChallengeToken(user.id, header);
  }

  private extractHeader(headers: Record<string, any>): string | null {
    const raw =
      headers['x-pin-challenge'] ??
      headers['X-PIN-CHALLENGE'] ??
      headers['x_pin_challenge'];

    if (!raw) return null;
    const s = String(raw);
    if (s.startsWith('Bearer ')) return s.slice(7).trim();
    return s.trim();
  }
}
