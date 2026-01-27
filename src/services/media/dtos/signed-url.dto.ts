import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class SignedUrlDto {
  @ApiProperty({
    description: 'The name of the file to be uploaded.',
    example: 'example-image.png',
  })
  @IsNotEmpty({ message: 'File name is required.' })
  fileName: string;

  @ApiProperty({
    description: 'The MIME type of the file to be uploaded.',
    example: 'image/png',
  })
  @IsNotEmpty({ message: 'File type is required.' })
  mimeType: string = 'image/png';

  @ApiProperty({
    description: 'The folder in S3 where the file will be uploaded.',
    example: 'medias',
    required: false,
  })
  @IsOptional({ message: 'Folder is optional, default is "medias".' })
  folder: string = 'medias';
}
