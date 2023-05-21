import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthenticateRequestDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
