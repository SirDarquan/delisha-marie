import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { dynamicPageResolver } from './resolvers/dynamic-page.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: ':slug',
    title: dynamicPageResolver,
    loadComponent: () => import('./pages/dynamic-page/dynamic-page').then((m) => m.DynamicPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
