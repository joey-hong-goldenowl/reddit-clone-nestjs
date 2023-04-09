export interface UploadImage {
  user_id: number;
  file: Express.Multer.File;
}

export interface DeleteImage {
  user_id: number;
  image_url: string;
}

export interface UploadVideo {
  user_id: number;
  file: Express.Multer.File;
}

export interface DeleteVideo {
  user_id: number;
  video_url: string;
}
