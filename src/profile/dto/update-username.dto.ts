import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUsernameRequestDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}
