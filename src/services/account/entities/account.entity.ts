import { ResponseBody } from '@Blithe/common/entity/response-body.entity';
import { AccountStatus, UserType } from '@DB/Client';
import { ApiProperty } from '@nestjs/swagger';
import { Credential } from './credentials.entity';
import { BaseEntity } from '@Blithe/common/entity/base.entity';
import { Wallet } from '@Blithe/services/wallet/entity/wallet.entity';

export class Account extends BaseEntity {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL of the user',
  })
  profileImage: string | null;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the user',
  })
  phone: string;

  @ApiProperty({
    example: UserType.guardian,
    enum: UserType,
    description: 'Type of the account',
  })
  type: UserType;

  @ApiProperty({
    example: AccountStatus.active,
    enum: AccountStatus,
    description: 'Status of the account',
  })
  accountStatus: AccountStatus;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Last seen timestamp of the user',
  })
  lastSeen: Date | null;

  verifiedAt: Date | null;

  @ApiProperty({
    type: () => Credential,
    description: 'Credential associated with the user',
  })
  credential: Credential;
}

export class Tokens {
  @ApiProperty({
    description: 'Access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'dGhpcy1pcz1hLXJlZnJlc2gtdG9rZW4tZXhhbXBsZQ==',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Expiration date of the access token',
    example: new Date(Date.now() + 3600 * 1000), // 1 hour from now
  })
  expiresAt: Date;
}

export class AuthCredentials {
  @ApiProperty({ type: Account, description: 'User account information' })
  user: Account;
  @ApiProperty({ type: Tokens, description: 'Authorization tokens' })
  tokens: Tokens;
  @ApiProperty({ type: Wallet, description: 'User wallet information' })
  wallet: Wallet;
}

export class AuthCredentialsResponse extends ResponseBody {
  @ApiProperty({ type: AuthCredentials })
  data: AuthCredentials;

  constructor(authCredentials: AuthCredentials) {
    super();
    this.data = authCredentials;
  }
}
