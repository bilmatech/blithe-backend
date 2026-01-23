import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthorizeUserDto {
  @ApiProperty({
    description: 'The email of the user to authorize',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Type(() => String)
  email: string;

  @ApiProperty({
    description: 'The password of the user to authorize',
    example: 'Str0ngP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Type(() => String)
  password: string;
}
