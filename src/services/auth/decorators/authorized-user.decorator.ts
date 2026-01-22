import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../auth.type';

export const AuthorizedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
