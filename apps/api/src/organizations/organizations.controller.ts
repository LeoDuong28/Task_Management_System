import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '../../../libs/data/src';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.orgsService.findAll(req.user);
  }

  @Post()
  @Roles(Role.OWNER)
  async create(@Body() body: { name: string }, @Request() req) {
    return this.orgsService.create(body.name, req.user);
  }
}
