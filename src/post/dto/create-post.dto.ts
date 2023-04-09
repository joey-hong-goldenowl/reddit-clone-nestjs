import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostType } from '../entities/post.entity';

export class CreatePostRequestDto {
  @IsNotEmpty()
  community_id: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body_text: string;

  @IsEnum(PostType)
  type: PostType;
}
