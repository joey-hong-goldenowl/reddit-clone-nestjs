import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserLoginType } from './entities/user.entity';
import { InsertResult, Repository } from 'typeorm';
import { RegisterRequestDto } from 'src/auth/dto/register.dto';
import { UpdateProfileRequestDto } from 'src/profile/dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { add, isAfter } from 'date-fns';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(registerRequestDto: RegisterRequestDto): Promise<InsertResult> {
    const newUser = this.userRepository.create({
      ...registerRequestDto,
      display_name: registerRequestDto.username
    });
    return this.userRepository.insert(newUser);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOneById(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async updateProfile(user: User, updateProfileRequestDto: UpdateProfileRequestDto) {
    await this.userRepository.update(user.id, {
      description: updateProfileRequestDto.description,
      display_name: updateProfileRequestDto.display_name,
      avatar: updateProfileRequestDto.avatar,
      background: updateProfileRequestDto.background
    });
    return this.findOneById(user.id);
  }

  async updatePassword(user: User, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashedPassword
    });
    return this.findOneById(user.id);
  }

  async updateEmail(user: User, newEmail: string) {
    await this.userRepository.update(user.id, {
      email: newEmail
    });
    return this.findOneById(user.id);
  }

  async updateUsername(user: User, newUsername: string) {
    await this.userRepository.update(user.id, {
      username: newUsername,
      update_username: true,
    });
    return this.findOneById(user.id);
  }

  async remove(id: number) {
    const removedUser = await this.userRepository.findOneBy({ id });
    if (removedUser) {
      await this.userRepository.delete({ id });
      return { success: true };
    }
    return new NotFoundException('User not found');
  }

  async removeAvatar(user: User) {
    await this.userRepository.update(user.id, {
      avatar: null
    });
  }

  async removeBackground(user: User) {
    await this.userRepository.update(user.id, {
      background: null
    });
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async findOneByUsername(username: string) {
    return this.userRepository.findOneBy({ username });
  }

  async findOneByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .leftJoinAndSelect('u.avatar', 'avatar')
      .leftJoinAndSelect('u.background', 'background')
      .where('email = :email', { email })
      .getOne();
  }

  async updateOneSignalPlayerId(user: User, playerId: string) {
    await this.userRepository.update(user.id, {
      onesignal_player_id: playerId
    });
  }

  async getUserOneSignalPlayerId(userId: number) {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        onesignal_player_id: true
      },
      where: {
        id: userId
      }
    });

    if (user !== null) {
      return user.onesignal_player_id;
    }
    return null;
  }

  async createWithGoogle(email: string) {
    const username = email.split('@')?.[0];
    const newUser = this.userRepository.create({
      email,
      username,
      display_name: username,
      login_type: UserLoginType.GOOGLE
    });
    return this.userRepository.insert(newUser);
  }

  async canUpdateUsername(userId: number) {
    const user = await this.findOneById(userId)
    const { created_at, login_type } = user
    if (login_type === UserLoginType.EMAIL) return false

    let hasUpdateUsername = user.update_username
    if (!hasUpdateUsername && isAfter(new Date(), add(created_at, { days: 30 }))) {
      hasUpdateUsername = true
      await this.userRepository.update(user.id, {
        update_username: true,
      });
    }

    return !hasUpdateUsername
  }
}
