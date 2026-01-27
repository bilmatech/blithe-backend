import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MediaUploadService } from './media-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeleteMediaDto } from './dtos/delete-media.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImageUploadDto } from './dtos/image-upload.dto';
import { SignedUrlDto } from './dtos/signed-url.dto';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
/**
 * MediaController handles media-related operations such as uploading images.
 */
@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaUploadService: MediaUploadService) {}

  /**
   * Uploads an image to the media storage.
   * @param uploadFile The image file to upload.
   * This method uploads an image file to the media storage and returns the URL of the uploaded image.
   * @returns  The URL of the uploaded image.
   */
  @ApiOperation({
    summary: 'Upload an image to the media storage',
  })
  @ApiBody({
    type: ImageUploadDto,
    description: 'Image file to be uploaded',
  })
  @ResponseMessage('Image file uploaded successfully!')
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('uploadFile'))
  async uploadImage(@UploadedFile() uploadFile: Express.Multer.File) {
    return this.mediaUploadService.uploadImageMedia(uploadFile);
  }

  /**
   *  Deletes a media file from the storage.
   * @param deleteMediaDto DeleteMediaDto containing the URL of the media file to be deleted.
   * This method deletes a media file from the storage.
   * @returns  A success message indicating the media file has been deleted.
   */
  @ApiOperation({
    summary: 'Delete a media file from the storage',
  })
  @ApiBody({
    type: DeleteMediaDto,
    description: 'URL of the media file to be deleted',
  })
  @ResponseMessage('Media file deleted successfully!')
  @Delete()
  async deleteMedia(@Query('fileUrl') fileUrl: string) {
    if (!fileUrl) {
      throw new BadRequestException('File Path is required for deletion');
    }
    return this.mediaUploadService.deleteMediaFile(fileUrl);
  }

  // --------------------------------------------
  @ApiOperation({
    summary: 'Get a signed URL for uploading a file to S3',
    description: 'Generates a signed URL for uploading a file to S3',
  })
  @ApiBody({
    type: SignedUrlDto,
    description: 'Parameters for generating the signed URL',
  })

  // -------------------------------------------
  @ResponseMessage('Signed URL generated successfully!')
  // -------------------------------------------
  @Post('signed-upload-url')
  async getSignedUrl(@Body() signedUrlDto: SignedUrlDto) {
    return this.mediaUploadService.signedUrl(signedUrlDto);
  }
}
