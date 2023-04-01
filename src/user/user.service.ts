import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const user = await this.userRepository.findOneBy({ email });
    if (user) {
      throw new BadRequestException('Email address is already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword
    });
    await this.userRepository.insert(newUser);
    return newUser;
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    return new NotFoundException('User not found');
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.find({ where: { id } });
    if (updatedUser) {
      return updatedUser;
    }
    return new NotFoundException('User not found');
  }

  async remove(id: number) {
    const removedUser = await this.userRepository.findOneBy({ id });
    if (removedUser) {
      await this.userRepository.delete({ id })
      return { success: true };
    }
    return new NotFoundException('User not found');
  }
}
