import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyAccountNumberDto {
  @ApiProperty({
    description: 'Bank account number to verify',
    example: '0000000000',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  @IsNotEmpty({ message: 'Account number is required' })
  @Type(() => String)
  accountNumber: string;

  @ApiProperty({
    description: 'Bank code of the bank to verify the account number against',
    example: '057',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank is required' })
  @Type(() => String)
  bankCode: string;
}
