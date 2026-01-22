import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateRefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'User Id is required for creating fresh token' })
  @Type(() => String)
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Token is required.' })
  @Type(() => String)
  token: string;

  @IsDate()
  @IsNotEmpty({ message: 'Expiration date is required.' })
  @Type(() => Date)
  expiresAt: Date = new Date();

  @IsBoolean()
  @Type(() => Boolean)
  revoked: boolean = false;
}
