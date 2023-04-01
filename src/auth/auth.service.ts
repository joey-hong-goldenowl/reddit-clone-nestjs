import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email } = registerDto;
    const user = await this.userService.findOneByEmail(email);
    if (user) {
      throw new BadRequestException('Email address is already in use');
    }
    await this.userService.create(registerDto);
    const newUser = await this.userService.findOneByEmail(email);
    return newUser;
  }
}
