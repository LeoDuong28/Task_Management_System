import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '../shared/types';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async getAuditLogs(@Request() req) {
    const user = req.user;
    const isOwner = user.role === Role.OWNER;
    return this.auditService.getLogsForOrganization(user.organizationId, isOwner);
  }
}
