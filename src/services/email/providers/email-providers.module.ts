import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { ConfigModule } from '@nestjs/config';
import emailConfig from '../config/email.config';
import { TemplateParserModule } from '../template-parser/template-parser.module';

@Module({
  imports: [ConfigModule.forFeature(emailConfig), TemplateParserModule],
  providers: [ResendService],
  exports: [ResendService],
})
export class EmailProvidersModule {}
