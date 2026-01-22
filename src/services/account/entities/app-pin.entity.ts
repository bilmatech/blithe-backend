import { ResponseBody } from '@Blithe/common/entity/response-body.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AppPin {
  @ApiProperty({
    example: 'PIN has been set successfully',
    description: 'Message indicating the result of the app pin operation',
  })
  message: string;
}

export class AppPinResponse extends ResponseBody {
  @ApiProperty({ type: AppPin })
  data: AppPin;

  constructor(data: AppPin) {
    super();
    this.data = data;
  }
}
