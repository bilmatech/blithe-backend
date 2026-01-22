import { ResponseBody } from '@sabiflow/common/entity/response-body.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshToken {
  @ApiProperty({
    description: 'The ID of the user associated with the refresh token.',
  })
  userId: string;

  @ApiProperty({
    description: 'The access token.',
  })
  accessToken: string;

  @ApiProperty({
    description: 'The refresh token.',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'The expiration date of the refresh token.',
  })
  expiresAt: Date;
}

export class RefreshTokenResponse extends ResponseBody {
  @ApiProperty({
    description: 'The refresh token details.',
    type: RefreshToken,
  })
  data: RefreshToken;

  constructor(refreshToken: RefreshToken) {
    super();
    this.data = refreshToken;
  }
}
