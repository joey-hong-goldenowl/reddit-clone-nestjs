import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAssetRequestDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
