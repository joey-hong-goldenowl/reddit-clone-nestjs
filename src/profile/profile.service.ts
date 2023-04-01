import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserService) {}

  updateProfile(user: User, updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(user, updateProfileDto);
  }

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto) {
    const { password, newPassword, confirmNewPassword } = updatePasswordDto;
    const isMatchWithCurrentPassword = await bcrypt.compare(password, user.password);

    if (!isMatchWithCurrentPassword) {
      throw new BadRequestException("Old password doesn't match");
    }

    if (password === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Confirm password must match');
    }

    return this.userService.updatePassword(user, newPassword);
  }

  async updateEmail(user: User, updateEmailDto: UpdateEmailDto) {
    const { newEmail, password } = updateEmailDto;
    const isMatchWithCurrentPassword = await bcrypt.compare(password, user.password);

    if (!isMatchWithCurrentPassword) {
      throw new BadRequestException("Password doesn't match");
    }

    const otherUser = await this.userService.findOneByEmail(newEmail);
    if (otherUser) {
      throw new BadRequestException('Email not available to use');
    }

    return this.userService.updateEmail(user, newEmail);
  }
}
