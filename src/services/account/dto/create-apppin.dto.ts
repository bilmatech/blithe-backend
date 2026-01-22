import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min, MinLength } from 'class-validator';

export class CreateApppinDto {
  @ApiProperty({
    example: 1234,
    description: 'A 4-digit numeric PIN for mobile app authentication',
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: 'PIN must be a number' })
  @Min(1000, { message: 'PIN must be exactly 4 digits' })
  @IsNotEmpty({ message: 'PIN is required' })
  pin: number;
}
