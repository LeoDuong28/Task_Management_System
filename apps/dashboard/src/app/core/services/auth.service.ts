import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  ApiResponse,
  AuthResponse,
  Role,
  Permission,
  RolePermissions,
} from '../models';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
  permissions: Permission[];
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  user = this.currentUserSignal.asReadonly();
  token = this.tokenSignal.asReadonly();

  isAuthenticated = computed(() => {
    const token = this.tokenSignal();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  userRole = computed(() => this.currentUserSignal()?.role);

  permissions = computed(() => {
    const role = this.userRole();
    return role ? RolePermissions[role] : [];
  });

  constructor() {
    this.loadFromStorage();
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.setAuth(res.data.accessToken, res.data.user);
          }
        }),
        catchError((err) => throwError(() => err))
      );
  }

  register(
    email: string,
    password: string,
    name: string,
    organizationName?: string
  ): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
        name,
        organizationName,
      })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.setAuth(res.data.accessToken, res.data.user);
          }
        }),
        catchError((err) => throwError(() => err))
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  hasRole(roles: Role | Role[]): boolean {
    const userRole = this.userRole();
    if (!userRole) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const payload = this.decodeToken(token);
        if (payload.exp * 1000 > Date.now()) {
          this.tokenSignal.set(token);
          this.currentUserSignal.set(JSON.parse(userJson));
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    }
  }

  private decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}
