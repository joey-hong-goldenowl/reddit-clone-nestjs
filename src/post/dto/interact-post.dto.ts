import { IsEnum } from 'class-validator';
import { PostInteractionType } from '../entities/post-interaction.entity';

export class InteractPostRequestDto {
  @IsEnum(PostInteractionType)
  type: PostInteractionType;
}
