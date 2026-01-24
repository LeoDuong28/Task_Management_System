import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role, TaskStatus, TaskPriority, TaskCategory, JwtPayload } from '@libs/data';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockUser: JwtPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    role: Role.OWNER,
    organizationId: 'org-1',
    permissions: [],
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.WORK,
    order: 1,
    ownerId: 'user-1',
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    create: jest.fn().mockResolvedValue(mockTask),
    findAll: jest.fn().mockResolvedValue([mockTask]),
    findOne: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue(undefined),
    reorder: jest.fn().mockResolvedValue([mockTask]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        Reflector,
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'New Task' };
      const req = { user: mockUser, ip: '127.0.0.1' } as any;

      const result = await controller.create(dto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(tasksService.create).toHaveBeenCalledWith(dto, mockUser, '127.0.0.1');
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const req = { user: mockUser } as any;

      const result = await controller.findAll(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockTask]);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const req = { user: mockUser } as any;

      const result = await controller.findOne('task-1', req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const dto = { title: 'Updated Task' };
      const req = { user: mockUser, ip: '127.0.0.1' } as any;

      const result = await controller.update('task-1', dto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const req = { user: mockUser, ip: '127.0.0.1' } as any;

      const result = await controller.remove('task-1', req);

      expect(result.success).toBe(true);
    });
  });

  describe('reorder', () => {
    it('should reorder tasks', async () => {
      const req = { user: mockUser } as any;
      const body = { order: 2, status: TaskStatus.IN_PROGRESS };

      const result = await controller.reorder('task-1', body, req);

      expect(result.success).toBe(true);
      expect(tasksService.reorder).toHaveBeenCalled();
    });
  });
});
