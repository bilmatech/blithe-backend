import { EmploymentStatus, IncomeSource } from '@DB/Client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateOnboardingDto {
  @ApiProperty({
    example: 'employed',
    enum: EmploymentStatus,
    description: 'Employment status of the user',
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty({ message: 'Employment status is required' })
  @Type(() => String)
  employmentStatus: EmploymentStatus;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Occupation of the user',
  })
  @IsNotEmpty({ message: 'Occupation is required' })
  @Type(() => String)
  occupation: string;

  @ApiProperty({
    example: 5000,
    description: 'Monthly income of the user',
  })
  @IsNotEmpty({ message: 'Monthly income is required' })
  @Type(() => Number)
  monthlyIncome: number;

  @ApiProperty({
    example: 'employed',
    enum: IncomeSource,
    description: 'Income source of the user',
  })
  @IsEnum(IncomeSource)
  @IsNotEmpty({ message: 'Income source is required' })
  @Type(() => String)
  incomeSource: IncomeSource;

  @ApiProperty({
    example: 'food delivery',
    description: 'Purpose of using the app',
  })
  @IsNotEmpty({ message: 'Purpose is required' })
  @Type(() => String)
  usesAppFor: string;
}
