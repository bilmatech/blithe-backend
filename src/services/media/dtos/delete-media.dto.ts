import { IsNotEmpty } from 'class-validator';

export class DeleteMediaDto {
  @IsNotEmpty()
  fileUrl: string;
}
