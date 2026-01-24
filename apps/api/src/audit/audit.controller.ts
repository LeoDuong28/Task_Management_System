import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiResponse, IAuditLog, Permission, Role } from '@libs/data';
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  Roles,
  Permissions,
} from '@libs/auth';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.VIEW_AUDIT)
  async findAll(@Query('limit') limit?: string): Promise<ApiResponse<IAuditLog[]>> {
    const logs = await this.auditService.findAll(limit ? parseInt(limit, 10) : 100);
    return {
      success: true,
      data: logs,
    };
  }
}
