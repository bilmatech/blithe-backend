import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum SourceType {
  WEB = 'web',
  MOBILE = 'mobile',
}
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

  @ApiProperty({
    description: 'The source from which the authorization request is made',
    example: SourceType.WEB,
    enum: SourceType,
    default: SourceType.WEB,
  })
  @IsNotEmpty({ message: 'Source is required' })
  @IsEnum(SourceType, { message: 'Invalid source type' })
  @Type(() => String)
  source: SourceType;
}
