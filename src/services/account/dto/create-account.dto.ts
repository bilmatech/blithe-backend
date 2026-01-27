import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Type(() => String)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Type(() => String)
  email: string;

  @ApiProperty({
    description: 'Profile picture URL of the user',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  profileImage?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  phone?: string;

  @ApiProperty({
    description: 'Accept terms and conditions and privacy policy',
    required: true,
  })
  @IsNotEmpty({
    message: 'You must accept the terms and conditions and privacy policy',
  })
  @IsBoolean({ message: 'isTermsAndPrivacyAccepted must be a boolean value' })
  @Type(() => Boolean)
  isTermsAndPrivacyAccepted: boolean;
}
