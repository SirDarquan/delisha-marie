import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { seoResolver } from './resolvers/seo.resolver';
import { schemaResolver } from './resolvers/schema.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description:
        'Discover authentic flavors and handcrafted recipes with Delisha Marie. Join our culinary journey for simple yet elegant dishes.',
      keywords: ['food blog', 'delisha marie', 'authentic recipes', 'home cooking', 'dallas food'],
      // breadcrumbs: [{ name: 'Home', item: '{{origin}}' }],
    },
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
    title: 'About',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description:
        'Learn about Delisha Marie, her culinary journey from family Sunday dinners to a lifelong passion for elevated simplicity in cooking.',
      keywords: ['delisha marie biography', 'culinary journey', 'cooking philosophy'],
    },
  },
  {
    path: 'recipe-index',
    loadComponent: () => import('./pages/recipe-index/recipe-index').then((m) => m.RecipeIndex),
    title: 'Recipe Index',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description:
        'Explore Delisha Marie’s recipe index for handcrafted, seasonal recipes. Simple, elegant dishes for elevated home cooking.',
      keywords: ['recipe index', 'food categories', 'delisha marie masterlist'],
    },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: 'Contact',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description:
        'Get in touch with Delisha Marie for recipe questions, collaborations, or just to say hi. Reach out via our studio in Dallas, TX.',
      keywords: ['contact delisha marie', 'recipe collaborations', 'dallas food studio'],
    },
  },
  // Top-level Collection Routes
  {
    path: 'recipes',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'recipes/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'methods',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'methods/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'holidays',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'holidays/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'special-diets',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'special-diets/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },

  // Recipe Collection Routes
  {
    path: 'recipes/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'recipes/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'recipes/:category/:subcategory',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'recipes/:category/:subcategory/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'methods/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'methods/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'holidays/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'holidays/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'special-diets/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'special-diets/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes/:category/:subcategory',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'the-best-recipes/:category/:subcategory/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'tag/:category',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'tag/:category/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'tag/:category/:subcategory',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  {
    path: 'tag/:category/:subcategory/page/:page',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
    resolve: { seo: seoResolver, schema: schemaResolver },
  },
  { path: '**', redirectTo: '' },
];
