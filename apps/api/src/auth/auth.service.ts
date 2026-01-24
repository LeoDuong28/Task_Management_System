import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Organization } from '../entities';
import { LoginDto, RegisterDto, Role } from '../../../libs/data/src';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    let organization: Organization;

    if (registerDto.organizationId) {
      organization = await this.orgRepository.findOne({
        where: { id: registerDto.organizationId }
      });
    }

    if (!organization) {
      organization = this.orgRepository.create({
        name: `${registerDto.firstName}'s Organization`
      });
      organization = await this.orgRepository.save(organization);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const isFirstUser = await this.userRepository.count() === 0;

    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      organizationId: organization.id,
      role: isFirstUser ? Role.OWNER : Role.VIEWER
    });

    const savedUser = await this.userRepository.save(user);

    const payload = { sub: savedUser.id, email: savedUser.email };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = savedUser;

    return {
      accessToken,
      user: userWithoutPassword
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['organization']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization']
    });
  }
}
