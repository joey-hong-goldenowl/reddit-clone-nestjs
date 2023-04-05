import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(7)
  password: string;
}
