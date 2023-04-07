import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { RegisterRequestDto } from './dto/register.dto';
import { TokenPayload } from './interface/auth.interface';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async register(registerRequestDto: RegisterRequestDto): Promise<User> {
    const { email, username } = registerRequestDto;
    const userWithSameEmail = await this.userService.findOneByEmail(email);
    if (userWithSameEmail) {
      throw new BadRequestException('Email address is already in use');
    }
    const userWithSameUsername = await this.userService.findOneByUsername(username);
    if (userWithSameUsername) {
      throw new BadRequestException('Username is already in use');
    }
    await this.userService.create(registerRequestDto);
    const newUser = await this.userService.findOneByEmail(email);
    return newUser;
  }

  async getAuthenticatedUser(email: string, password: string) {
    const user = await this.userService.findOneByEmailWithPassword(email);
    if (!user) {
      throw new BadRequestException('Email or password is invalid');
    }
    await this.verifyPassword(password, user.password);
    return user;
  }

  async verifyPassword(password: string, hashedPassword: string) {
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      throw new BadRequestException('Email or password is invalid');
    }
  }

  getCookieWithJwtToken(userId: number): string {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload);
    return token;
  }
}
