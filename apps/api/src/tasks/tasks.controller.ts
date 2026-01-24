import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { TasksService } from "./tasks.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  ApiResponse,
  ITask,
  Permission,
  Role,
  JwtPayload,
  TaskStatus,
} from "@libs/data";
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  Roles,
  Permissions,
} from "@libs/auth";
import { Task } from "./task.entity";

interface AuthRequest extends Request {
  user: JwtPayload;
}

const toITask = (task: Task): ITask => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  status: task.status,
  priority: task.priority,
  category: task.category,
  order: task.order,
  ownerId: task.ownerId,
  organizationId: task.organizationId,
  dueDate: task.dueDate ?? undefined,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const toITasks = (tasks: Task[]): ITask[] => tasks.map(toITask);

@Controller("tasks")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.CREATE_TASK)
  async create(
    @Body() dto: CreateTaskDto,
    @Req() req: AuthRequest
  ): Promise<ApiResponse<ITask>> {
    const task = await this.tasksService.create(dto, req.user, req.ip);
    return {
      success: true,
      data: toITask(task as Task),
      message: "Task created successfully",
    };
  }

  @Get()
  @Permissions(Permission.READ_TASK)
  async findAll(@Req() req: AuthRequest): Promise<ApiResponse<ITask[]>> {
    const tasks = await this.tasksService.findAll(req.user);
    return {
      success: true,
      data: toITasks(tasks as Task[]),
    };
  }

  @Get(":id")
  @Permissions(Permission.READ_TASK)
  async findOne(
    @Param("id") id: string,
    @Req() req: AuthRequest
  ): Promise<ApiResponse<ITask>> {
    const task = await this.tasksService.findOne(id, req.user);
    return {
      success: true,
      data: toITask(task as Task),
    };
  }

  @Put(":id")
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.UPDATE_TASK)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthRequest
  ): Promise<ApiResponse<ITask>> {
    const task = await this.tasksService.update(id, dto, req.user, req.ip);
    return {
      success: true,
      data: toITask(task as Task),
      message: "Task updated successfully",
    };
  }

  @Delete(":id")
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.DELETE_TASK)
  async remove(
    @Param("id") id: string,
    @Req() req: AuthRequest
  ): Promise<ApiResponse<null>> {
    await this.tasksService.remove(id, req.user, req.ip);

    return {
      success: true,
      message: "Task deleted successfully",
    };
  }

  @Put(":id/reorder")
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.UPDATE_TASK)
  async reorder(
    @Param("id") id: string,
    @Body() body: { order: number; status: TaskStatus },
    @Req() req: AuthRequest
  ): Promise<ApiResponse<ITask[]>> {
    const tasks = await this.tasksService.reorder(
      id,
      body.order,
      body.status,
      req.user
    );
    return {
      success: true,
      data: toITasks(tasks as Task[]),
      message: "Tasks reordered successfully",
    };
  }
}
