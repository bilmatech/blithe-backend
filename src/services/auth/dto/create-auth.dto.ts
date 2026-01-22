import { AccountType } from '@DB/Client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeviceInfoDto } from './device-info.dto';

export class CreateAuthDto {
  @ApiProperty({
    description: 'Firebase ID Token',
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE1YTAwNWU5N2NiMWU0MjczMDBlNTJjZGQ1MGYwYjM2Y2Q4MDYyOWIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiT0JJIFBBU0NBTCBCQU5KVUFSRSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKRXhieVFtM1lHb2JvNjNUSU1WQzI2QUlHWENqZUR4UjBEb3ZXRUgtUUZDWnphejhYNT1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9iaWxtYXBheS1wcm9kIiwiYXVkIjoiYmlsbWFwYXktcHJvZCIsImF1dGhfdGltZSI6MTc2MDMxMDY0NywidXNlcl9pZCI6InFJQUxJZ1V5VWhQMHF0dEJCOWRYY29HdWJYZTIiLCJzdWIiOiJxSUFMSWdVeVVoUDBxdHRCQjlkWGNvR3ViWGUyIiwiaWF0IjoxNzYwMzEwNjQ3LCJleHAiOjE3NjAzMTQyNDcsImVtYWlsIjoicGFzY2Fsb2JpODNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTM2MTc4OTI3MDcxOTA4OTUwNTQiXSwiZW1haWwiOlsicGFzY2Fsb2JpODNAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.C7hkYtZVmgwT-MdF2HT8q7YmOJeJIDHhDPIkPQH9NgMDhVpJfyroQwy-k0t_3-g0cVcf38UYAuF0D1SOq8zDK1ZLhHHCCvtGdHDdOU0Knc303f8tyWw7DrD2h3x8DXwtTC1fzAy9guS9xkgQkgZXUXGuK2Cfr9-dykh-3GTOR9uwJQIDT8iO1Gus2OIXnTwfrpZJVaYEpKcGtzH2RuewYgPlhPgUVFpUpVT1LwO_5nqXLAiOdrYtldeNRBr5Nvd5UAaUihiy0FO6-p7PVB6F1c_cdZqMwuwcHXnN1Y92-hNVL5Zhao2hLUAMnwEe-GpeOG78CCxmBx10MVP6AzE1XA',
  })
  @IsString({ message: 'Firebase ID Token must be a string' })
  @IsNotEmpty({ message: 'Firebase ID Token is required' })
  @Type(() => String)
  idToken: string;

  @ApiProperty({
    description: 'User account type',
    enum: AccountType,
    example: AccountType.Personal,
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType: AccountType = AccountType.Personal;

  @ApiPropertyOptional({
    description: 'User referral code',
    example: 'A2dwRWaE12W',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: 'Device information for security purposes',
    type: DeviceInfoDto,
  })
  @IsNotEmpty({ message: 'Device information is required', each: true })
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

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
