import { IsFile } from '@FynndFit/common/validators/is-file.validator';
import { IsNotEmpty } from 'class-validator';

export class ImageUploadDto {
  @IsNotEmpty()
  @IsFile()
  uploadFile: Express.Multer.File;
}
