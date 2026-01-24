import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./audit.entity";
import { IAuditLog } from "@libs/data";

interface CreateAuditDto {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}

const toIAuditLog = (log: AuditLog): IAuditLog => ({
  id: log.id,
  userId: log.userId,
  action: log.action,
  resource: log.resource,
  resourceId: log.resourceId ?? undefined,
  details: log.details ?? undefined,
  ipAddress: log.ipAddress ?? undefined,
  timestamp: log.timestamp,
});

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>
  ) {}

  async log(dto: CreateAuditDto): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      userId: dto.userId,
      action: dto.action,
      resource: dto.resource,
      resourceId: dto.resourceId,
      details: dto.details,
      ipAddress: dto.ipAddress,
    });

    const saved = await this.auditRepo.save(entry);

    console.log(
      `[AUDIT] ${new Date().toISOString()} | User: ${dto.userId} | Action: ${
        dto.action
      } | Resource: ${dto.resource} | ID: ${dto.resourceId || "N/A"}`
    );

    return saved;
  }

  async findAll(limit = 100): Promise<IAuditLog[]> {
    const logs = await this.auditRepo.find({
      order: { timestamp: "DESC" },
      take: limit,
      relations: ["user"],
    });
    return logs.map(toIAuditLog);
  }

  async findByUser(userId: string, limit = 50): Promise<IAuditLog[]> {
    const logs = await this.auditRepo.find({
      where: { userId },
      order: { timestamp: "DESC" },
      take: limit,
    });
    return logs.map(toIAuditLog);
  }

  async findByResource(
    resource: string,
    resourceId?: string
  ): Promise<IAuditLog[]> {
    const where: any = { resource };
    if (resourceId) {
      where.resourceId = resourceId;
    }

    const logs = await this.auditRepo.find({
      where,
      order: { timestamp: "DESC" },
    });
    return logs.map(toIAuditLog);
  }
}
