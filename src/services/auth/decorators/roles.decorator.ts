import { UserRole } from '@DB/Client';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const UseRolesGuard = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
