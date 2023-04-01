import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1)
  display_name: string;

  @IsOptional()
  @IsString()
  description: string;
}
