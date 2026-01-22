import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWdvYnRzeHcwMDAwdHNsMG04eTJpN3N4IiwiaWF0IjoxNzYwNjI2MDQ1LCJleHAiOjE3NjEyMzA4NDV9.5xG9e6YnWoaxov5j97Iw-P0DDx37qs8kCgGWRLQWceI',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required.' })
  @Type(() => String)
  token: string;
}
