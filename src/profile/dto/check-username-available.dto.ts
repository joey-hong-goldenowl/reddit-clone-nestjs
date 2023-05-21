import { IsNotEmpty, IsString } from 'class-validator';

export class CheckUsernameAvailableRequestDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}
