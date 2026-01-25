import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { environment } from "../../../environments/environment";

type LoginResponse = {
  success?: boolean;
  data?: {
    accessToken?: string;
    user?: { email?: string; name?: string; role?: string };
  };
  message?: string;
};

@Component({
  standalone: true,
  selector: "app-login",
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div style="max-width: 420px; margin: 48px auto; font-family: system-ui;">
      <h1 style="margin: 0 0 16px;">Login</h1>

      <form (ngSubmit)="onLogin()" style="display: grid; gap: 12px;">
        <label>
          <div style="font-size: 14px; margin-bottom: 6px;">Email</div>
          <input
            [(ngModel)]="email"
            name="email"
            type="email"
            required
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label>
          <div style="font-size: 14px; margin-bottom: 6px;">Password</div>
          <input
            [(ngModel)]="password"
            name="password"
            type="password"
            required
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <button
          type="submit"
          [disabled]="loading"
          style="padding: 10px; border-radius: 8px; border: 0; cursor: pointer;">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <div *ngIf="error" style="margin-top: 12px; color: #b00020;">
        {{ error }}
      </div>

      <div *ngIf="token" style="margin-top: 16px;">
        <div style="font-weight: 600; margin-bottom: 6px;">✅ Logged in</div>
        <div style="font-size: 12px; word-break: break-all; opacity: 0.85;">
          Token saved to localStorage as <code>token</code>.
        </div>
      </div>

      <div style="margin-top: 18px; font-size: 12px; opacity: 0.7;">
        API: <code>{{ apiBase }}</code>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private http = inject(HttpClient);

  apiBase = environment.apiUrl; // should be .../api
  email = "duongtrongnghia287@gmail.com";
  password = "Password123@";

  loading = false;
  error = "";
  token = "";

  onLogin() {
    this.loading = true;
    this.error = "";

    this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          const t = res?.data?.accessToken || "";
          if (!t) {
            this.error = res?.message || "Login failed.";
            return;
          }
          this.token = t;
          localStorage.setItem("token", t);
        },
        error: (err) => {
          this.error =
            err?.error?.message || "Request failed (check API URL / CORS).";
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
