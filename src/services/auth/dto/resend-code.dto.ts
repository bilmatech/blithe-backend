import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendCodeDto {
  @ApiProperty({
    description: 'Email address of the user to resend the verification code to',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email: string;
}
