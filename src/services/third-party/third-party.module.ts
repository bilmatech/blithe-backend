import { Module } from '@nestjs/common';
import { PaystackService } from './paystack/paystack.service';
import thirdPartyConfig from './config/third-party.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(thirdPartyConfig)],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class ThirdPartyModule {}
