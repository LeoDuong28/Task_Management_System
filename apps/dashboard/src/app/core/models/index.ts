export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum Permission {
  CREATE_TASK = 'create:task',
  READ_TASK = 'read:task',
  UPDATE_TASK = 'update:task',
  DELETE_TASK = 'delete:task',
  VIEW_AUDIT = 'view:audit',
  MANAGE_USERS = 'manage:users',
  MANAGE_ORG = 'manage:org',
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

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  OTHER = 'other',
}

export interface Task {
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
  owner?: User;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  timestamp: Date;
  user?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
