import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsEmail()
  newEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
