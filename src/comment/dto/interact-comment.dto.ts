import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CommentInteractionType } from '../entities/comment-interaction.entity';

export class InteractCommentRequestDto {
  @IsEnum(CommentInteractionType)
  type: CommentInteractionType;

  @IsOptional()
  @IsBoolean()
  remove_interaction: boolean;
}
