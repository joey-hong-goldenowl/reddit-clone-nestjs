import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');
import { UploadImage } from './interfaces/UploadImage.interface';
import { getImageId } from '../helpers/utils/string';
import { DeleteImage } from './interfaces/DeleteImage.interface';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(uploadImage: UploadImage) {
    const { user_id, file } = uploadImage;
    const environment = this.configService.get('ENVIRONMENT');
    return new Promise(resolve => {
      const upload = v2.uploader.upload_stream(
        {
          folder: `${environment}/${user_id}`
        },
        (error, result) => {
          if (error) throw new UnprocessableEntityException(error.message);
          resolve(result);
        }
      );

      toStream(file.buffer).pipe(upload);
    });
  }

  async deleteImage(deleteImage: DeleteImage) {
    const { image_url, user_id } = deleteImage;
    const environment = this.configService.get('ENVIRONMENT');
    const imagePublicId = getImageId(image_url);
    const result = await v2.uploader.destroy(`${environment}/${user_id}/${imagePublicId}`);
    return result;
  }
}
