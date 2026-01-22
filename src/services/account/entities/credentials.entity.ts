import { ApiProperty } from '@nestjs/swagger';
import { Account } from './account.entity';
import { ResponseBody } from '@Blithe/common/entity/response-body.entity';

export class Credential {
  @ApiProperty({
    example: 'ckv1z8h3a0002qzrmn6j4v6vb',
    description: 'Unique identifier for the credential',
  })
  id: string;

  @ApiProperty({
    example: 'ckv1z8h3a0000qzrmn6j4v6v9',
    description: 'User ID associated with the credential',
  })
  userId: string;

  @ApiProperty({
    example: 'hashed_password_123',
    description: 'Hashed password of the user',
  })
  token: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Expiration date of the token',
  })
  expiresAt: Date;

  @ApiProperty({
    example: false,
    description: 'Indicates if the token is revoked',
  })
  revoked: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if the credential is deleted',
  })
  isDeleted: boolean;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the credential was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the credential was created',
  })
  createdAt: Date;

  @ApiProperty({
    type: () => Account,
    description: 'User associated with the credential',
  })
  user: Account;
}

export class CredentialResponse extends ResponseBody {
  @ApiProperty({ type: Credential })
  data: Credential;

  constructor(credential: Credential) {
    super();
    this.data = credential;
  }
}
