import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrganizationsService } from './organizations.service';
import { ApiResponse, IOrganization, JwtPayload, Permission, Role } from '@libs/data';
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  Roles,
  Permissions,
} from '@libs/auth';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get('current')
  async getCurrentOrganization(
    @Req() req: AuthRequest
  ): Promise<ApiResponse<IOrganization>> {
    const org = await this.orgsService.findUserOrganization(req.user);
    return {
      success: true,
      data: org,
    };
  }

  @Post('sub')
  @Roles(Role.OWNER)
  @Permissions(Permission.MANAGE_ORG)
  async createSubOrganization(
    @Body() body: { name: string },
    @Req() req: AuthRequest
  ): Promise<ApiResponse<IOrganization>> {
    const org = await this.orgsService.createSubOrganization(
      body.name,
      req.user.organizationId
    );
    return {
      success: true,
      data: org,
      message: 'Sub-organization created successfully',
    };
  }
}
