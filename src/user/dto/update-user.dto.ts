import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsEmail()
  email: string;
}
