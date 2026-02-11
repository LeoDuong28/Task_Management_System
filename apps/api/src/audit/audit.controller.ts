import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse, IAuditLog, Permission, Role, JwtPayload } from '@libs/data';
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

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.VIEW_AUDIT)
  async findAll(
    @Req() req: AuthRequest,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<IAuditLog[]>> {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const logs = await this.auditService.findAll(
      req.user.organizationId,
      isNaN(parsedLimit) || parsedLimit < 1 ? 100 : Math.min(parsedLimit, 500),
    );
    return {
      success: true,
      data: logs,
    };
  }
}
