import { UserType } from '@DB/Client';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const UseRolesGuard = (...roles: UserType[]) =>
  SetMetadata(ROLES_KEY, roles);
