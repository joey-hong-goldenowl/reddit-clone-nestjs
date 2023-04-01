import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userService: UserService) {}

  updateProfile(user: User, updateProfileDto: UpdateProfileDto) {
    return this.userService.update(user, updateProfileDto);
  }
}
