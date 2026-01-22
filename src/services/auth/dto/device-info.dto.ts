import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeviceInfoDto {
  @ApiProperty({
    description: 'Name of the device',
    example: 'John’s iPhone 12',
  })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  deviceName: string;

  @ApiProperty({
    description: 'Platform of the device',
    example: 'iOS 14.4',
  })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  platform: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  ip?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  userAgent?: string;

  @ApiProperty({
    description: 'Screen size of the device',
    example: '1170x2532',
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  screen?: string;

  @ApiProperty({
    description: 'Timezone of the device',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  timezone?: string;

  @ApiProperty({
    description: 'Unique device identifier',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsString()
  @IsOptional()
  @Type(() => String)
  deviceId?: string;
}
