import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, User, Organization } from '../entities';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditService {
  private logFilePath: string;

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) {
    this.logFilePath = path.join(process.cwd(), 'audit.log');
  }

  async log(
    action: string,
    resource: string,
    resourceId: string,
    user: User,
    details?: string
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      resource,
      resourceId,
      userId: user.id,
      organizationId: user.organizationId,
      details
    });

    await this.auditLogRepository.save(auditLog);

    const logEntry = `[${new Date().toISOString()}] ${action} - ${resource}:${resourceId} by User:${user.id} (Org:${user.organizationId}) ${details || ''}\n`;
    
    console.log(logEntry);
    
    fs.appendFileSync(this.logFilePath, logEntry);

    return auditLog;
  }

  async getLogsForOrganization(organizationId: string, includeChildren: boolean = false) {
    let orgIds = [organizationId];

    if (includeChildren) {
      const childOrgs = await this.orgRepository.find({
        where: { parentId: organizationId }
      });
      orgIds = [...orgIds, ...childOrgs.map(o => o.id)];
    }

    return this.auditLogRepository.find({
      where: orgIds.map(id => ({ organizationId: id })),
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: 100
    });
  }
}
