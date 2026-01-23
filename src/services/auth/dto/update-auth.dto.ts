import { PartialType } from '@nestjs/swagger';
import { CreateAuthUserDto } from './create-auth-user.dto';

export class UpdateAuthDto extends PartialType(CreateAuthUserDto) {}
