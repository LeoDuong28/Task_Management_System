import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '../../../libs/data/src';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user);
  }

  @Put(':id/role')
  @Roles(Role.OWNER)
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: Role },
    @Request() req
  ) {
    return this.usersService.updateRole(id, body.role, req.user);
  }
}
