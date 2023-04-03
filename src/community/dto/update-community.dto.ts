import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Asset } from '../../asset/entities/asset.entity';

export class UpdateCommunityDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  avatar: Asset;

  @IsOptional()
  banner: Asset;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  delete_avatar: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  delete_banner: boolean;
}
