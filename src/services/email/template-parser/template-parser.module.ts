import { Module } from '@nestjs/common';
import { TemplateParserService } from './template-parser.service';

@Module({
  providers: [TemplateParserService],
  exports: [TemplateParserService],
})
export class TemplateParserModule {}
