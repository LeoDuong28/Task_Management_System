import {
  Role,
  Permission,
  RolePermissions,
} from '../../../libs/data/src/index';
import {
  hasPermission,
  hasRole,
  canAccessOrganization,
  isResourceOwner,
} from '../../../libs/auth/src/index';

describe('RBAC Logic', () => {
  describe('Role Permissions', () => {
    it('should grant all permissions to Owner', () => {
      const ownerPermissions = RolePermissions[Role.OWNER];
      
      expect(ownerPermissions).toContain(Permission.CREATE_TASK);
      expect(ownerPermissions).toContain(Permission.READ_TASK);
      expect(ownerPermissions).toContain(Permission.UPDATE_TASK);
      expect(ownerPermissions).toContain(Permission.DELETE_TASK);
      expect(ownerPermissions).toContain(Permission.VIEW_AUDIT);
      expect(ownerPermissions).toContain(Permission.MANAGE_USERS);
      expect(ownerPermissions).toContain(Permission.MANAGE_ORG);
    });

    it('should grant limited permissions to Admin', () => {
      const adminPermissions = RolePermissions[Role.ADMIN];
      
      expect(adminPermissions).toContain(Permission.CREATE_TASK);
      expect(adminPermissions).toContain(Permission.READ_TASK);
      expect(adminPermissions).toContain(Permission.UPDATE_TASK);
      expect(adminPermissions).toContain(Permission.DELETE_TASK);
      expect(adminPermissions).toContain(Permission.VIEW_AUDIT);
      expect(adminPermissions).not.toContain(Permission.MANAGE_ORG);
    });

    it('should grant read-only permission to Viewer', () => {
      const viewerPermissions = RolePermissions[Role.VIEWER];
      
      expect(viewerPermissions).toContain(Permission.READ_TASK);
      expect(viewerPermissions).not.toContain(Permission.CREATE_TASK);
      expect(viewerPermissions).not.toContain(Permission.UPDATE_TASK);
      expect(viewerPermissions).not.toContain(Permission.DELETE_TASK);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has required permission', () => {
      const userPermissions = [Permission.CREATE_TASK, Permission.READ_TASK];
      const required = [Permission.READ_TASK];
      
      expect(hasPermission(userPermissions, required)).toBe(true);
    });

    it('should return false when user lacks required permission', () => {
      const userPermissions = [Permission.READ_TASK];
      const required = [Permission.DELETE_TASK];
      
      expect(hasPermission(userPermissions, required)).toBe(false);
    });

    it('should return true when user has all required permissions', () => {
      const userPermissions = [
        Permission.CREATE_TASK,
        Permission.READ_TASK,
        Permission.UPDATE_TASK,
      ];
      const required = [Permission.CREATE_TASK, Permission.READ_TASK];
      
      expect(hasPermission(userPermissions, required)).toBe(true);
    });

    it('should return false when user lacks any required permission', () => {
      const userPermissions = [Permission.READ_TASK];
      const required = [Permission.READ_TASK, Permission.UPDATE_TASK];
      
      expect(hasPermission(userPermissions, required)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has allowed role', () => {
      expect(hasRole(Role.OWNER, [Role.OWNER, Role.ADMIN])).toBe(true);
      expect(hasRole(Role.ADMIN, [Role.OWNER, Role.ADMIN])).toBe(true);
    });

    it('should return false when user does not have allowed role', () => {
      expect(hasRole(Role.VIEWER, [Role.OWNER, Role.ADMIN])).toBe(false);
    });
  });

  describe('canAccessOrganization', () => {
    it('should allow access to own organization', () => {
      expect(canAccessOrganization('org-1', undefined, 'org-1')).toBe(true);
    });

    it('should allow access to parent organization', () => {
      expect(canAccessOrganization('org-2', 'org-1', 'org-1')).toBe(true);
    });

    it('should deny access to unrelated organization', () => {
      expect(canAccessOrganization('org-1', undefined, 'org-3')).toBe(false);
    });

    it('should deny access when no parent relationship exists', () => {
      expect(canAccessOrganization('org-1', 'org-2', 'org-3')).toBe(false);
    });
  });

  describe('isResourceOwner', () => {
    it('should return true when user is resource owner', () => {
      expect(isResourceOwner('user-1', 'user-1')).toBe(true);
    });

    it('should return false when user is not resource owner', () => {
      expect(isResourceOwner('user-1', 'user-2')).toBe(false);
    });
  });
});

describe('Role Inheritance', () => {
  it('should verify Owner has more permissions than Admin', () => {
    const ownerPerms = RolePermissions[Role.OWNER];
    const adminPerms = RolePermissions[Role.ADMIN];
    
    expect(ownerPerms.length).toBeGreaterThan(adminPerms.length);
    adminPerms.forEach((perm) => {
      expect(ownerPerms).toContain(perm);
    });
  });

  it('should verify Admin has more permissions than Viewer', () => {
    const adminPerms = RolePermissions[Role.ADMIN];
    const viewerPerms = RolePermissions[Role.VIEWER];
    
    expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
    viewerPerms.forEach((perm) => {
      expect(adminPerms).toContain(perm);
    });
  });
});
