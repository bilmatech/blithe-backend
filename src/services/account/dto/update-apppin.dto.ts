import { PartialType } from '@nestjs/swagger';
import { CreateApppinDto } from './create-apppin.dto';
import { IsOptional } from 'class-validator';

export class UpdateApppinDto extends PartialType(CreateApppinDto) {
  //  Don't need to be documented by swagger because it's used internally
  @IsOptional()
  lastUsedAt?: Date;

  @IsOptional()
  lastResetAt?: Date;
}
