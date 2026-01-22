import { passwordRegex } from '@Blithe/common/utils/regex.util';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The reset token received by the user for password reset',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiY29kZSI6IjEyMzQ1NiIsImV4cGlyZXNBdCI6IjIwMjQtMDYtMDFUMTI6MDA6MDBaIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  @Type(() => String)
  token: string;

  @ApiProperty({
    description: 'New password for the user account',
    example: 'NewStr0ngP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Matches(passwordRegex, {
    message:
      'Password is too weak. It must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.',
  })
  @Type(() => String)
  newPassword: string;
}
