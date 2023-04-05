import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Asset } from '../../asset/entities/asset.entity';

export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString()
  @Length(1)
  display_name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  avatar: Asset;

  @IsOptional()
  background: Asset;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  delete_avatar: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  delete_background: boolean;
}
