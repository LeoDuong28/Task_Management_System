import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './task.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  JwtPayload,
  Role,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from '@libs/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private auditService: AuditService
  ) {}

  async create(dto: CreateTaskDto, user: JwtPayload, ip?: string): Promise<Task> {
    const maxOrder = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.organizationId = :orgId', { orgId: user.organizationId })
      .andWhere('task.status = :status', { status: dto.status || TaskStatus.TODO })
      .select('MAX(task.order)', 'max')
      .getRawOne();

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || TaskPriority.MEDIUM,
      category: dto.category || TaskCategory.OTHER,
      order: (maxOrder?.max || 0) + 1,
      ownerId: user.sub,
      organizationId: user.organizationId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    const saved = await this.taskRepo.save(task);

    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      resource: 'task',
      resourceId: saved.id,
      details: `Created task: ${saved.title}`,
      ipAddress: ip,
    });

    return saved;
  }

  async findAll(user: JwtPayload): Promise<Task[]> {
    const orgIds = [user.organizationId];

    if (user.parentOrganizationId) {
      orgIds.push(user.parentOrganizationId);
    }

    if (user.role === Role.VIEWER) {
      return this.taskRepo.find({
        where: { organizationId: In(orgIds) },
        order: { status: 'ASC', order: 'ASC' },
        relations: ['owner'],
      });
    }

    return this.taskRepo.find({
      where: { organizationId: In(orgIds) },
      order: { status: 'ASC', order: 'ASC' },
      relations: ['owner'],
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.checkAccess(task, user);

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    user: JwtPayload,
    ip?: string
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot update tasks');
    }

    if (user.role === Role.ADMIN && task.ownerId !== user.sub) {
      const isOrgTask = task.organizationId === user.organizationId;
      if (!isOrgTask) {
        throw new ForbiddenException('Cannot update tasks outside your organization');
      }
    }

    Object.assign(task, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    });

    const updated = await this.taskRepo.save(task);

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      resource: 'task',
      resourceId: updated.id,
      details: `Updated task: ${updated.title}`,
      ipAddress: ip,
    });

    return updated;
  }

  async remove(id: string, user: JwtPayload, ip?: string): Promise<void> {
    const task = await this.findOne(id, user);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    if (user.role === Role.ADMIN && task.ownerId !== user.sub) {
      throw new ForbiddenException('Admins can only delete their own tasks');
    }

    await this.taskRepo.remove(task);

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      resource: 'task',
      resourceId: id,
      details: `Deleted task: ${task.title}`,
      ipAddress: ip,
    });
  }

  async reorder(
    taskId: string,
    newOrder: number,
    newStatus: TaskStatus,
    user: JwtPayload
  ): Promise<Task[]> {
    const task = await this.findOne(taskId, user);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot reorder tasks');
    }

    const oldStatus = task.status;
    const oldOrder = task.order;

    task.status = newStatus;
    task.order = newOrder;

    if (oldStatus !== newStatus) {
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" - 1' })
        .where('organizationId = :orgId', { orgId: user.organizationId })
        .andWhere('status = :status', { status: oldStatus })
        .andWhere('order > :oldOrder', { oldOrder })
        .execute();

      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" + 1' })
        .where('organizationId = :orgId', { orgId: user.organizationId })
        .andWhere('status = :status', { status: newStatus })
        .andWhere('order >= :newOrder', { newOrder })
        .execute();
    } else {
      if (newOrder > oldOrder) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" - 1' })
          .where('organizationId = :orgId', { orgId: user.organizationId })
          .andWhere('status = :status', { status: oldStatus })
          .andWhere('order > :oldOrder', { oldOrder })
          .andWhere('order <= :newOrder', { newOrder })
          .execute();
      } else {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" + 1' })
          .where('organizationId = :orgId', { orgId: user.organizationId })
          .andWhere('status = :status', { status: oldStatus })
          .andWhere('order >= :newOrder', { newOrder })
          .andWhere('order < :oldOrder', { oldOrder })
          .execute();
      }
    }

    await this.taskRepo.save(task);

    return this.findAll(user);
  }

  private checkAccess(task: Task, user: JwtPayload): void {
    const allowedOrgs = [user.organizationId];
    if (user.parentOrganizationId) {
      allowedOrgs.push(user.parentOrganizationId);
    }

    if (!allowedOrgs.includes(task.organizationId)) {
      throw new ForbiddenException('Access denied to this task');
    }
  }
}
