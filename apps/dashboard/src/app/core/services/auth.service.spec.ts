import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { Role, Permission, RolePermissions } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoib3duZXIiLCJvcmdhbml6YXRpb25JZCI6Im9yZy0xIiwicGVybWlzc2lvbnMiOlsiY3JlYXRlOnRhc2siLCJyZWFkOnRhc2siXSwiZXhwIjo5OTk5OTk5OTk5fQ.mock';

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.OWNER,
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isAuthenticated when no token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should return correct permissions for owner role', () => {
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const newService = TestBed.inject(AuthService);
    const permissions = RolePermissions[Role.OWNER];

    expect(permissions.length).toBeGreaterThan(0);
    expect(permissions).toContain(Permission.CREATE_TASK);
  });

  it('should have all permissions for owner', () => {
    const ownerPermissions = RolePermissions[Role.OWNER];

    expect(ownerPermissions).toContain(Permission.CREATE_TASK);
    expect(ownerPermissions).toContain(Permission.READ_TASK);
    expect(ownerPermissions).toContain(Permission.UPDATE_TASK);
    expect(ownerPermissions).toContain(Permission.DELETE_TASK);
    expect(ownerPermissions).toContain(Permission.VIEW_AUDIT);
    expect(ownerPermissions).toContain(Permission.MANAGE_USERS);
    expect(ownerPermissions).toContain(Permission.MANAGE_ORG);
  });

  it('should have limited permissions for viewer', () => {
    const viewerPermissions = RolePermissions[Role.VIEWER];

    expect(viewerPermissions).toContain(Permission.READ_TASK);
    expect(viewerPermissions).not.toContain(Permission.CREATE_TASK);
    expect(viewerPermissions).not.toContain(Permission.UPDATE_TASK);
    expect(viewerPermissions).not.toContain(Permission.DELETE_TASK);
  });

  it('should clear auth data on logout', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should check role correctly', () => {
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const newService = TestBed.inject(AuthService);

    expect(newService.hasRole(Role.OWNER)).toBeTrue();
    expect(newService.hasRole(Role.VIEWER)).toBeFalse();
    expect(newService.hasRole([Role.OWNER, Role.ADMIN])).toBeTrue();
  });
});
