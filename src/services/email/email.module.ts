import { Module } from '@nestjs/common';
import { TemplateParserService } from './template-parser/template-parser.service';
import { EmailService } from './email.service';
import { ResendService } from './providers/resend.service';
import { ConfigModule } from '@nestjs/config';
import emailConfig from './configs/email.config';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [TemplateParserService, ResendService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
