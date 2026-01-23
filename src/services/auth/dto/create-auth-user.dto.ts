import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CreateAccountDto } from '@Blithe/services/account/dto/create-account.dto';
import { passwordRegex } from '@Blithe/common/utils/regex.util';

export class CreateAuthUserDto extends CreateAccountDto {
  @ApiProperty({
    description: 'Password for the user account',
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Matches(passwordRegex, {
    message:
      'Password is too weak. It must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.',
  })
  @Type(() => String)
  password: string;

  @ApiPropertyOptional({
    description: 'Firebase Cloud Messaging token for push notifications',
    example:
      'eXampleFCMToken1234567890abcdefghijklmnopqrstuvwxyzABCD_EFGHIJKLMN-OPQRSTUVWX',
  })
  @IsString({ message: 'FCM token must be a string' })
  @IsOptional()
  @Type(() => String)
  fcmToken?: string;
}
