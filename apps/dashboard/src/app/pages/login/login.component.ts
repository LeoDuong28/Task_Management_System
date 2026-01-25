import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  selector: "app-login",
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width:420px;margin:48px auto;font-family:system-ui;">
      <h1 style="margin:0 0 12px;">Sign in</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label style="display:block;margin:12px 0 6px;">Email</label>
        <input
          formControlName="email"
          type="email"
          style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;" />

        <label style="display:block;margin:12px 0 6px;">Password</label>
        <input
          formControlName="password"
          type="password"
          style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;" />

        <button
          type="submit"
          [disabled]="form.invalid || loading"
          style="margin-top:16px;width:100%;padding:10px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer;">
          {{ loading ? "Signing in..." : "Sign in" }}
        </button>

        <p *ngIf="error" style="color:#b00020;margin-top:12px;">{{ error }}</p>
        <p *ngIf="ok" style="color:#0a7a0a;margin-top:12px;">Logged in ✅</p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  loading = false;
  error = "";
  ok = false;

  form = this.fb.group({
    email: [
      "duongtrongnghia287@gmail.com",
      [Validators.required, Validators.email],
    ],
    password: ["Password123@", [Validators.required]],
  });

  submit() {
    this.error = "";
    this.ok = false;
    this.loading = true;

    this.http
      .post<any>(
        `${environment.apiUrl}/api/auth/login`,
        this.form.getRawValue()
      )
      .subscribe({
        next: (res) => {
          const token = res?.data?.accessToken;
          if (!token) {
            this.error = "Token missing from response.";
            return;
          }
          localStorage.setItem("token", token);
          this.ok = true;
        },
        error: (err) => {
          this.error = err?.error?.message || "Login failed";
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
