import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtPayload, IUser } from '@libs/data';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async findAll(currentUser: JwtPayload): Promise<Omit<IUser, 'password'>[]> {
    const users = await this.userRepo.find({
      where: { organizationId: currentUser.organizationId },
      select: ['id', 'email', 'name', 'role', 'organizationId', 'createdAt', 'updatedAt'],
    });

    return users;
  }

  async findOne(id: string): Promise<Omit<IUser, 'password'>> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'organizationId', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    return this.findOne(userId);
  }
}
