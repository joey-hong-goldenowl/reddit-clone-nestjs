import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  type: string;
}
