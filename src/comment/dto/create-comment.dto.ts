import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCommentRequestDto {
  @IsNotEmpty()
  @IsNumber()
  post_id: number;

  @IsNotEmpty()
  @IsString()
  content: string;
}
