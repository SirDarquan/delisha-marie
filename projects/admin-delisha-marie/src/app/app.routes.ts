import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./pages/recipes-list/recipes-list').then((m) => m.RecipesListComponent),
    canActivate: [authGuard],
  },

  {
    path: 'recipes/edit/:id',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
