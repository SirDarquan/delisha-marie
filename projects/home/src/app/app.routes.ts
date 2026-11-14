import { Routes } from '@angular/router';

import { dynamicPageResolver } from './resolvers/dynamic-page.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
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
