import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetRequestDto {
  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  type: string;
}
