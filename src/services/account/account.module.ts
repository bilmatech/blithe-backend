import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [AccountService, CredentialsService],
  exports: [AccountService, CredentialsService],
})
export class AccountModule {}
