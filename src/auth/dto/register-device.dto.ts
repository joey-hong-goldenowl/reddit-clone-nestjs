import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceRequestDto {
  @IsNotEmpty()
  @IsString()
  player_id: string;
}
