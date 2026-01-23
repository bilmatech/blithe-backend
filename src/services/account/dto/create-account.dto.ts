import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Type(() => String)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Type(() => String)
  email: string;

  @ApiProperty({
    description: 'Profile picture URL of the user',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  profileImage?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  phone?: string;

  @ApiProperty({
    description: 'Last seen timestamp of the user',
    example: '2023-10-05T14:48:00.000Z',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastSeen?: Date;
}
