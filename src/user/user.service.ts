import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const newPost = await this.userRepository.create(createUserDto)
    await this.userRepository.save(newPost)
    return newPost
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const list = await this.userRepository.findBy({ id })
    if (list.length > 0) {
      return list[0];
    }
    return new NotFoundException('User not found');
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    const updatedPost = await this.userRepository.find({ where: { id } });
    if (updatedPost) {
      return updatedPost
    }
    return new NotFoundException('User not found')
  }

  async remove(id: number) {
    const list = await this.userRepository.findBy({ id })
    if (list.length > 0) {
      const removedUser = list[0];
      removedUser.is_deleted = true
      await this.userRepository.save(removedUser);
      return { success: true }
    }
    return new NotFoundException('User not found')
  }
}
