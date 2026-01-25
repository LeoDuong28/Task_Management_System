import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeSignal = signal(false);

  isDarkMode = this.darkModeSignal.asReadonly();

  initTheme(): void {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);

    this.setDarkMode(shouldBeDark);
  }

  toggleTheme(): void {
    this.setDarkMode(!this.darkModeSignal());
  }

  private setDarkMode(dark: boolean): void {
    this.darkModeSignal.set(dark);

    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
