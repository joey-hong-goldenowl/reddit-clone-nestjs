import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { InsertResult, Repository } from 'typeorm';
import { RegisterRequestDto } from 'src/auth/dto/register.dto';
import { UpdateProfileRequestDto } from 'src/profile/dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

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
}
