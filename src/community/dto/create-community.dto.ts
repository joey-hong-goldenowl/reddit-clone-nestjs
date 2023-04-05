import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommunityRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
