import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div
      style="padding: 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto;">
      <h1 style="margin: 0 0 12px;">Task Management Dashboard</h1>
      <p style="margin: 0 0 16px; opacity: 0.8;">
        App is running. If you haven't built pages yet, this is the starter
        shell.
      </p>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {}
