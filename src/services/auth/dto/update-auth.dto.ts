import { PartialType } from '@nestjs/swagger';
import { CreateAuthDto } from './create-auth-user.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
