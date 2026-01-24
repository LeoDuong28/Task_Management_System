import { SetMetadata } from '@nestjs/common';
import { Permission, Role } from '@libs/data';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export function hasPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every((p) => userPermissions.includes(p));
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAccessOrganization(
  userOrgId: string,
  userParentOrgId: string | undefined,
  targetOrgId: string
): boolean {
  if (userOrgId === targetOrgId) return true;
  if (userParentOrgId && userParentOrgId === targetOrgId) return true;
  return false;
}

export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

export * from './guards';
