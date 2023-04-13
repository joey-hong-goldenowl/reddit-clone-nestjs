import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentRequestDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
