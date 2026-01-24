export enum Role {
  OWNER = "owner",
  ADMIN = "admin",
  VIEWER = "viewer",
}

export enum Permission {
  CREATE_TASK = "create:task",
  READ_TASK = "read:task",
  UPDATE_TASK = "update:task",
  DELETE_TASK = "delete:task",
  VIEW_AUDIT = "view:audit",
  MANAGE_USERS = "manage:users",
  MANAGE_ORG = "manage:org",
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_AUDIT,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ORG,
  ],
  [Role.ADMIN]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_AUDIT,
    Permission.MANAGE_USERS,
  ],
  [Role.VIEWER]: [Permission.READ_TASK],
};

export interface IUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: Role;
  organizationId: string;
  parentOrganizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganization {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  order: number;
  ownerId: string;
  organizationId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskCategory {
  WORK = "work",
  PERSONAL = "personal",
  SHOPPING = "shopping",
  HEALTH = "health",
  OTHER = "other",
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  organizationId?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  order?: number;
  dueDate?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Omit<IUser, "password">;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
  parentOrganizationId?: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}
