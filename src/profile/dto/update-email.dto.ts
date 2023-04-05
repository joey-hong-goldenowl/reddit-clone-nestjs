import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailRequestDto {
  @IsNotEmpty()
  @IsEmail()
  newEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
