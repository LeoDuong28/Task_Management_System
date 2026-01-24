import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  user = this.userSignal.asReadonly();
  token = this.tokenSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.tokenSignal.set(token);
      this.userSignal.set(JSON.parse(user));
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.tokenSignal.set(response.accessToken);
          this.userSignal.set(response.user);
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
      );
  }

  register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          this.tokenSignal.set(response.accessToken);
          this.userSignal.set(response.user);
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
      );
  }

  logout() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  hasPermission(permission: string): boolean {
    const user = this.userSignal();
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      owner: ['create_task', 'read_task', 'update_task', 'delete_task', 'view_audit', 'manage_users'],
      admin: ['create_task', 'read_task', 'update_task', 'delete_task', 'view_audit'],
      viewer: ['read_task']
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  }
}
