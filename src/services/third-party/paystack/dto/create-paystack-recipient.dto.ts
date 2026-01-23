import { OmitType } from '@nestjs/swagger';
import { TransferDto } from './transfer.dto';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaystackRecipientDto extends OmitType(TransferDto, [
  'amount',
  'desc',
  'recipientCode',
]) {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Type(() => String)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  @MaxLength(10, { message: 'Account number must not exceed 10 characters' })
  @Matches(/^\d+$/, { message: 'Account number must contain only digits' })
  @Type(() => String)
  accountNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  @MaxLength(10, { message: 'Bank code must not exceed 10 characters' })
  @Matches(/^\d+$/, { message: 'Bank code must contain only digits' })
  @Type(() => String)
  bankCode: string;
}
