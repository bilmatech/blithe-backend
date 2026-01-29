import { BaseEntity } from '@Blithe/common/entity/base.entity';
import { WalletStatus } from '@DB/Client';
import { ApiProperty } from '@nestjs/swagger';

export class Wallet extends BaseEntity {
  @ApiProperty({
    example: 'ckw1z8h3a0000qzrmn6j4v6v9',
    description: 'Unique identifier for the wallet',
  })
  userId: string;

  @ApiProperty({
    description: 'User wallet address (usually the bank account number)',
    example: '1234567890',
  })
  address: string;

  @ApiProperty({
    description: 'Name of the user associated with the bank account',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The bank name associated with the bank account',
    example: 'First Bank of Nigeria',
  })
  tag: string;

  @ApiProperty({
    description:
      'The routing number(bank code) associated with the bank account',
    example: '058',
  })
  routingNumber: string;

  @ApiProperty({
    description: 'Current balance of the wallet',
    example: '1500.75',
  })
  balance: string;

  @ApiProperty({
    description: 'Current balance of the wallet in NGN formatted string',
    example: '₦1,500.75',
  })
  ngnBalance: string;

  @ApiProperty({
    description: 'Status of the wallet',
    example: WalletStatus.Active,
    enum: WalletStatus,
  })
  status: WalletStatus;
}
