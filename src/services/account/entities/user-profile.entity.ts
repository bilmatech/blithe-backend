import { ResponseBody } from '@Blithe/common/entity/response-body.entity';
import { EmploymentStatus, IncomeSource } from '@DB/Client';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from './account.entity';

export class UserProfile {
  @ApiProperty({
    // id is a cuid
    example: 'ckv1z8h3a0001qzrmn6j4v6va',
    description: 'Unique identifier for the profile',
  })
  id: string;

  @ApiProperty({
    example: 'ckv1z8h3a0000qzrmn6j4v6v9',
    description: 'User ID associated with the profile',
  })
  userId: string;

  @ApiProperty({
    example: EmploymentStatus.Employed,
    enum: EmploymentStatus,
    description: 'Employment status of the user',
  })
  employmentStatus: EmploymentStatus;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Occupation of the user',
  })
  occupation: string;

  @ApiProperty({
    example: 5000,
    description: 'Monthly income of the user',
  })
  monthlyIncome: number;

  @ApiProperty({
    example: IncomeSource.Business_Revenue,
    enum: IncomeSource,
    description: 'Income source of the user',
  })
  incomeSource: IncomeSource;

  @ApiProperty({
    example: 'Budgeting, Savings',
    description: 'Purpose of using the app',
  })
  usesAppFor: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the profile was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the profile was created',
  })
  createdAt: Date;

  @ApiProperty({
    type: () => Account,
  })
  user: Account;
}

export class UserProfileResponse extends ResponseBody {
  @ApiProperty({ type: UserProfile })
  data: UserProfile;

  constructor(profile: UserProfile) {
    super();
    this.data = profile;
  }
}
