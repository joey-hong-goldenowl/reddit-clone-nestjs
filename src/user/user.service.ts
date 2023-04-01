import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { InsertResult, Repository } from 'typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(registerDto: RegisterDto): Promise<InsertResult> {
    const newUser = this.userRepository.create({
      ...registerDto,
      display_name: registerDto.username
    });
    return this.userRepository.insert(newUser);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    return new NotFoundException('User not found');
  }

  async update(user: User, updateProfileDto: UpdateProfileDto) {
    await this.userRepository.update(user.id, {
      description: updateProfileDto.description,
      display_name: updateProfileDto.display_name
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

  async findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }
}
