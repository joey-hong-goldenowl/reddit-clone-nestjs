import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UploadApiResponse } from 'cloudinary';
import { AssetService } from 'src/asset/asset.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { UpdateEmailRequestDto } from './dto/update-email.dto';
import { UpdatePasswordRequestDto } from './dto/update-password.dto';
import { UpdateProfileRequestDto } from './dto/update-profile.dto';
import { UpdateUsernameRequestDto } from './dto/update-username.dto';
import { CheckUsernameAvailableRequestDto } from './dto/check-username-available.dto';
import { UserLoginType } from 'src/user/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserService, private readonly cloudinaryService: CloudinaryService, private readonly assetService: AssetService) {}

  async updateProfile(user: User, updateProfileRequestDto: UpdateProfileRequestDto, avatar: Express.Multer.File, background: Express.Multer.File) {
    delete updateProfileRequestDto.background;
    delete updateProfileRequestDto.avatar;
    const { delete_avatar = false, delete_background = false } = updateProfileRequestDto;
    if (delete_avatar && user.avatar) {
      const asset_id = user.avatar.id;
      await this.cloudinaryService.deleteImage({
        image_url: user.avatar.url,
        user_id: user.id
      });
      await this.userService.removeAvatar(user);
      await this.assetService.delete(asset_id);
    } else if (avatar) {
      const uploadedAvatar = await this.cloudinaryService.uploadImage({
        user_id: user.id,
        file: avatar
      });
      const { secure_url } = uploadedAvatar as UploadApiResponse;

      if (user.avatar) {
        await this.cloudinaryService.deleteImage({
          image_url: user.avatar.url,
          user_id: user.id
        });
        await this.assetService.update(user.avatar.id, {
          url: secure_url,
          type: 'image'
        });
      } else {
        const avatarAsset = await this.assetService.create({
          url: secure_url,
          type: 'image'
        });
        updateProfileRequestDto.avatar = avatarAsset;
      }
    }
    if (delete_background && user.background) {
      const asset_id = user.background.id;
      await this.cloudinaryService.deleteImage({
        image_url: user.background.url,
        user_id: user.id
      });
      await this.userService.removeBackground(user);
      await this.assetService.delete(asset_id);
    } else if (background) {
      const uploadedBackground = await this.cloudinaryService.uploadImage({
        user_id: user.id,
        file: background
      });
      const { secure_url } = uploadedBackground as UploadApiResponse;

      if (user.background) {
        await this.cloudinaryService.deleteImage({
          image_url: user.background.url,
          user_id: user.id
        });
        await this.assetService.update(user.background.id, {
          url: secure_url,
          type: 'image'
        });
      } else {
        const backgroundAsset = await this.assetService.create({
          url: secure_url,
          type: 'image'
        });
        updateProfileRequestDto.background = backgroundAsset;
      }
    }
    return this.userService.updateProfile(user, updateProfileRequestDto);
  }

  async updatePassword(user: User, updatePasswordRequestDto: UpdatePasswordRequestDto) {
    if (user.login_type === UserLoginType.GOOGLE) throw new BadRequestException()
    const { password, newPassword, confirmNewPassword } = updatePasswordRequestDto;
    const userWithPassword = await this.userService.findOneByEmailWithPassword(user.email);
    const isMatchWithCurrentPassword = await bcrypt.compare(password, userWithPassword.password);

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

  async updateEmail(user: User, updateEmailRequestDto: UpdateEmailRequestDto) {
    if (user.login_type === UserLoginType.GOOGLE) throw new BadRequestException()
    const { newEmail, password } = updateEmailRequestDto;

    if (user.email === newEmail) {
      throw new BadRequestException('New email must be diffrent');
    }

    const userWithSameEmail = await this.userService.findOneByEmail(newEmail);
    if (userWithSameEmail) {
      throw new BadRequestException('Email not available to use');
    }

    const userWithPassword = await this.userService.findOneByEmailWithPassword(user.email);
    const isMatchWithCurrentPassword = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatchWithCurrentPassword) {
      throw new BadRequestException("Password doesn't match");
    }

    return this.userService.updateEmail(user, newEmail);
  }

  async updateUsername(user: User, updateUsernameRequestDto: UpdateUsernameRequestDto) {
    const canUpdateUsername = await this.userService.canUpdateUsername(user.id)
    if (!canUpdateUsername) throw new BadRequestException()
    const { username } = updateUsernameRequestDto;
    const userWithSameUsername = await this.userService.findOneByUsername(username);
    if (userWithSameUsername) {
      throw new BadRequestException('Username is already in use');
    }

    return this.userService.updateUsername(user, username);
  }

  async checkUsernameAvailability(checkUsernameAvailableRequestDto: CheckUsernameAvailableRequestDto) {
    const { username } = checkUsernameAvailableRequestDto;
    const user = await this.userService.findOneByUsername(username);
    return {
      available: user === null
    };
  }

  async canUpdateUsername(user: User) {
    const canUpdateUsername = await this.userService.canUpdateUsername(user.id)
    return {
      can_update_username: canUpdateUsername,
    }
  }
}
