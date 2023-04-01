import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

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

  async getAuthenticatedUser(email: string, password: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('Email or password is invalid');
    }
    await this.verifyPassword(password, user.password);
    return user;
  }

  async verifyPassword(password: string, hashedPassword: string) {
    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordMatch) {
      throw new BadRequestException('Email or password is invalid');
    }
  }

  getCookieWithJwtToken(userId: number): string {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload);
    return token;
  }
}
