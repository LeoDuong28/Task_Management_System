import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: async () => {
      const { HomeComponent } = await import("./pages/home/home.component");
      return HomeComponent;
    },
  },
  { path: "**", redirectTo: "" },
];
