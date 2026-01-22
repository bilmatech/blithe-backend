import { ResponseBody } from '@sabiflow/common/entity/response-body.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PinChallengeToken {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJja2l6OHY0ZTAwMDBscXpybW42ZzV6NXY5IiwiaWF0IjoxNjg3NzI1MjI0LCJleHAiOjE2ODc3MjU1MjR9.dQw4w9WgXcQ',
    description: 'The JWT token for the PIN challenge',
  })
  token: string;

  @ApiProperty({
    example: '2024-06-26T12:34:56.789Z',
    description: 'The expiration date and time of the PIN challenge token',
  })
  expiresAt: Date;
}

export class PinChallenge {
  @ApiProperty({
    // cuid
    example: 'ckjz8v4e0000lqzrmn6g5z5v9',
    description: 'The user ID associated with the PIN challenge',
  })
  userId: string;

  @ApiProperty({
    description: 'The PIN challenge token details',
    type: PinChallengeToken,
  })
  XPinChallengeToken: PinChallengeToken;
}

export class PinChallengeResponse extends ResponseBody {
  @ApiProperty({ type: PinChallenge })
  data: PinChallenge;

  constructor(pinChallenge: PinChallenge) {
    super();
    this.data = pinChallenge;
  }
}
