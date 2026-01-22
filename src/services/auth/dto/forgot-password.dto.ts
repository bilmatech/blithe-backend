import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user requesting password reset',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email: string;
}
