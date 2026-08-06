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
    path: 'recipes/new',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pages',
    loadComponent: () => import('./pages/pages-list/pages-list').then((m) => m.PagesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'pages/:slug',
    loadComponent: () =>
      import('./pages/page-editor/page-editor').then((m) => m.PageEditorComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/edit/:id',
    loadComponent: () =>
      import('./pages/recipe-form/recipe-form').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recipes/:id/comments',
    loadComponent: () =>
      import('./pages/recipe-comments/recipe-comments').then((m) => m.RecipeCommentsComponent),
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
