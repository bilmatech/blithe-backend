// roles.decorator.ts
import { AccountType } from '@DB/Client';
import { SetMetadata } from '@nestjs/common';

export const ACCOUNT_TYPES_KEY = 'accountTypes';
export const UseAccountGuard = (...accountTypes: AccountType[]) =>
  SetMetadata(ACCOUNT_TYPES_KEY, accountTypes);
