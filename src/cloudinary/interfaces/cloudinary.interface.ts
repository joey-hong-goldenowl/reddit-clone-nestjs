export interface UploadImage {
  user_id: number;
  file: Express.Multer.File;
}

export interface DeleteImage {
  user_id: number;
  image_url: string;
}
