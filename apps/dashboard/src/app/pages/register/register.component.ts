import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900 p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img
            src="assets/logo.png"
            alt="Leo Duong"
            class="h-24 mx-auto mb-4" />
          <h1
            class="text-2xl font-display font-bold text-surface-900 dark:text-white">
            Create Account
          </h1>
          <p class="text-surface-500 dark:text-surface-400 mt-2">
            Start managing your tasks today
          </p>
        </div>

        <div class="card">
          @if (error()) {
          <div
            class="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
          </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Full Name</label
              >
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                class="input"
                placeholder="John Doe"
                required />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Email</label
              >
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                class="input"
                placeholder="YourEmail@email.com"
                required />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Password</label
              >
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                class="input"
                placeholder="••••••••"
                required
                minlength="6" />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Organization Name
                <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                [(ngModel)]="organizationName"
                name="organizationName"
                class="input"
                placeholder="Leo Duong Inc" />
              <p class="text-xs text-surface-400 mt-1.5">
                Create a new organization or leave empty to join default
              </p>
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="btn btn-primary w-full">
              @if (loading()) {
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Creating account... } @else { Create account }
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-surface-500 dark:text-surface-400">
              Already have an account?
              <a
                routerLink="/login"
                class="text-primary-600 hover:text-primary-500 font-medium ml-1">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = "";
  email = "";
  password = "";
  organizationName = "";
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (!this.name || !this.email || !this.password) {
      this.error.set("Please fill in all required fields");
      return;
    }

    if (this.password.length < 6) {
      this.error.set("Password must be at least 6 characters");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService
      .register(
        this.email,
        this.password,
        this.name,
        this.organizationName || undefined
      )
      .subscribe({
        next: () => {
          this.router.navigate(["/dashboard"]);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || "Registration failed");
        },
      });
  }
}
