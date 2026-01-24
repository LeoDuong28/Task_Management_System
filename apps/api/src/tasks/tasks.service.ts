import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, User, Organization } from '../entities';
import { CreateTaskDto, UpdateTaskDto, Role, Permission, RolePermissions } from '../shared/types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  private hasPermission(user: User, permission: Permission): boolean {
    const permissions = RolePermissions[user.role as Role] || [];
    return permissions.includes(permission);
  }

  private async getAccessibleOrgIds(user: User): Promise<string[]> {
    const orgIds = [user.organizationId];

    if (user.role === Role.OWNER) {
      const childOrgs = await this.orgRepository.find({
        where: { parentId: user.organizationId }
      });
      orgIds.push(...childOrgs.map(o => o.id));
    }

    return orgIds;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    if (!this.hasPermission(user, Permission.CREATE_TASK)) {
      throw new ForbiddenException('You do not have permission to create tasks');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
      organizationId: user.organizationId
    });

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      'CREATE',
      'task',
      savedTask.id,
      user,
      `Created task: ${savedTask.title}`
    );

    return savedTask;
  }

  async findAll(user: User, filters?: { status?: string; category?: string }): Promise<Task[]> {
    if (!this.hasPermission(user, Permission.READ_TASK)) {
      throw new ForbiddenException('You do not have permission to view tasks');
    }

    const orgIds = await this.getAccessibleOrgIds(user);

    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.organizationId IN (:...orgIds)', { orgIds });

    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      queryBuilder.andWhere('task.category = :category', { category: filters.category });
    }

    queryBuilder.orderBy('task.priority', 'DESC')
      .addOrderBy('task.createdAt', 'DESC');

    await this.auditService.log(
      'READ',
      'tasks',
      'list',
      user,
      'Listed all accessible tasks'
    );

    return queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    if (!this.hasPermission(user, Permission.READ_TASK)) {
      throw new ForbiddenException('You do not have permission to view tasks');
    }

    const orgIds = await this.getAccessibleOrgIds(user);

    const task = await this.taskRepository.findOne({
      where: { id, organizationId: In(orgIds) },
      relations: ['createdBy', 'assignedTo']
    });

    if (!task) {
      throw new NotFoundException('Task not found or not accessible');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    if (!this.hasPermission(user, Permission.UPDATE_TASK)) {
      throw new ForbiddenException('You do not have permission to update tasks');
    }

    const task = await this.findOne(id, user);

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      'UPDATE',
      'task',
      id,
      user,
      `Updated task: ${JSON.stringify(updateTaskDto)}`
    );

    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    if (!this.hasPermission(user, Permission.DELETE_TASK)) {
      throw new ForbiddenException('You do not have permission to delete tasks');
    }

    const task = await this.findOne(id, user);

    await this.taskRepository.remove(task);

    await this.auditService.log(
      'DELETE',
      'task',
      id,
      user,
      `Deleted task: ${task.title}`
    );
  }

  async reorder(taskIds: string[], user: User): Promise<Task[]> {
    if (!this.hasPermission(user, Permission.UPDATE_TASK)) {
      throw new ForbiddenException('You do not have permission to reorder tasks');
    }

    const tasks = await Promise.all(
      taskIds.map(async (id, index) => {
        const task = await this.findOne(id, user);
        task.priority = taskIds.length - index;
        return this.taskRepository.save(task);
      })
    );

    await this.auditService.log(
      'REORDER',
      'tasks',
      'bulk',
      user,
      `Reordered ${taskIds.length} tasks`
    );

    return tasks;
  }
}
