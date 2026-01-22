import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth.type';

@Injectable()
export class AccountGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAccTypes = this.reflector.get<string[]>(
      'accountTypes',
      context.getHandler(),
    );
    if (!requiredAccTypes) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    return requiredAccTypes.includes(user.accountType as string);
  }
}

export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    return requiredRoles.includes(user.role as string);
  }
}
