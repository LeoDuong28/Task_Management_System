import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { ApiResponse, IUser, JwtPayload } from '@libs/data';
import { JwtAuthGuard } from '@libs/auth';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: AuthRequest): Promise<ApiResponse<Omit<IUser, 'password'>>> {
    const user = await this.usersService.getProfile(req.user.sub);
    return {
      success: true,
      data: user,
    };
  }

  @Get()
  async findAll(@Req() req: AuthRequest): Promise<ApiResponse<Omit<IUser, 'password'>[]>> {
    const users = await this.usersService.findAll(req.user);
    return {
      success: true,
      data: users,
    };
  }
}
