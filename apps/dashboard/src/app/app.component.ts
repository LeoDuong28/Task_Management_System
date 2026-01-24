import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.initTheme();
  }
}
