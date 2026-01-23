// roles.decorator.ts
import { UserType } from '@DB/Client';
import { SetMetadata } from '@nestjs/common';

export const ACCOUNT_TYPES_KEY = 'accountTypes';
export const UseAccountGuard = (...accountTypes: UserType[]) =>
  SetMetadata(ACCOUNT_TYPES_KEY, accountTypes);
