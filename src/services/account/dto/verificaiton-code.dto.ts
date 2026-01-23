import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationCodeDto {
  @ApiProperty({
    description: 'Verification code sent to the user',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Type(() => String)
  code: string;
}
