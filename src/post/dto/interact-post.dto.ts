import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PostInteractionType } from '../entities/post-interaction.entity';

export class InteractPostRequestDto {
  @IsEnum(PostInteractionType)
  type: PostInteractionType;

  @IsOptional()
  @IsBoolean()
  remove_interaction: boolean;
}
