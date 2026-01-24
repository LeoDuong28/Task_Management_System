import { Role, Permission, RolePermissions } from '../../data/src';

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions ? permissions.includes(permission) : false;
}

export function getRoleHierarchy(role: Role): Role[] {
  switch (role) {
    case Role.OWNER:
      return [Role.OWNER, Role.ADMIN, Role.VIEWER];
    case Role.ADMIN:
      return [Role.ADMIN, Role.VIEWER];
    case Role.VIEWER:
      return [Role.VIEWER];
    default:
      return [];
  }
}

export function canAccessRole(userRole: Role, targetRole: Role): boolean {
  const hierarchy = getRoleHierarchy(userRole);
  return hierarchy.includes(targetRole);
}

export function isOrganizationAccessible(
  userOrgId: string,
  targetOrgId: string,
  orgHierarchy: Map<string, string | null>
): boolean {
  if (userOrgId === targetOrgId) {
    return true;
  }
  
  let currentOrgId: string | null | undefined = targetOrgId;
  while (currentOrgId) {
    const parentId = orgHierarchy.get(currentOrgId);
    if (parentId === userOrgId) {
      return true;
    }
    currentOrgId = parentId;
  }
  
  return false;
}

export { Role, Permission, RolePermissions } from '../../data/src';
