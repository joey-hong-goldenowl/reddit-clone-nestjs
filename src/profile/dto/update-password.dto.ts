import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordRequestDto {
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmNewPassword: string;
}
