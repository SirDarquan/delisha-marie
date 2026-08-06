import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import {
  recipeListTitleResolver,
  recipeResolver,
  recipeTitleResolver,
} from './resolvers/recipe.resolver';
import {
  schemaDynamicPageResolver,
  schemaRecipeResolver,
  schemaResolver,
} from './resolvers/schema.resolver';
import {
  seoDynamicPageResolver,
  seoRecipeListResolver,
  seoRecipeResolver,
  seoResolver,
} from './resolvers/seo.resolver';
import { dynamicPageResolver } from './resolvers/dynamic-page.resolver';

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
    },
  },
  // {
  //   path: 'about',
  //   loadComponent: () => import('./pages/about/about').then((m) => m.About),
  //   title: 'About',
  //   resolve: { seo: seoResolver, schema: schemaResolver },
  //   data: {
  //     description:
  //       'Learn about Delisha Marie, her culinary journey from family Sunday dinners to a lifelong passion for elevated simplicity in cooking.',
  //     keywords: ['delisha marie biography', 'culinary journey', 'cooking philosophy'],
  //   },
  // },
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
  // {
  //   path: 'contact',
  //   loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  //   title: 'Contact',
  //   resolve: { seo: seoResolver, schema: schemaResolver },
  //   data: {
  //     description:
  //       'Get in touch with Delisha Marie for recipe questions, collaborations, or just to say hi. Reach out via our studio in Dallas, TX.',
  //     keywords: ['contact delisha marie', 'recipe collaborations', 'dallas food studio'],
  //   },
  // },
  // Top-level Collection Routes
  ...[
    'recipes',
    'methods',
    'holidays',
    'special-diets',
    'the-best-recipes',
    // Recipe Collection Routes
    'recipes/:category',
    'recipes/:category/:subcategory',
    'methods/:category',
    'holidays/:category',
    'special-diets/:category',
    'the-best-recipes/:category',
    'the-best-recipes/:category/:subcategory',
    'tag/:category',
    'tag/:category/:subcategory',
  ].flatMap((path) => [
    {
      path,
      title: recipeListTitleResolver,
      loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
      resolve: { seo: seoRecipeListResolver, schema: schemaResolver },
    },
    {
      path: `${path}/page/:page`,
      title: recipeListTitleResolver,
      loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeList),
      resolve: { seo: seoRecipeListResolver, schema: schemaResolver },
    },
  ]),
  {
    path: 'recipe/:slug/print',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-print/recipe-print').then((m) => m.RecipePrint),
    resolve: {
      recipe: recipeResolver,
    },
  },
  {
    path: 'recipe/:slug',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-detail/recipe-detail').then((m) => m.RecipeDetail),
    resolve: {
      recipe: recipeResolver,
      seo: seoRecipeResolver,
      schema: schemaRecipeResolver,
    },
  },
  {
    path: 'recipe/:slug/page/:page',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-detail/recipe-detail').then((m) => m.RecipeDetail),
    resolve: {
      recipe: recipeResolver,
      seo: seoRecipeResolver,
      schema: schemaRecipeResolver,
    },
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search').then((m) => m.SearchPage),
    title: 'Search Recipes',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description: 'Search for semantic matches across all Delisha Marie recipes.',
      keywords: ['recipe search', 'find recipe'],
    },
  },
  {
    path: 'search/page/:page',
    loadComponent: () => import('./pages/search/search').then((m) => m.SearchPage),
    title: 'Search Recipes',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description: 'Search for semantic matches across all Delisha Marie recipes.',
      keywords: ['recipe search', 'find recipe'],
    },
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/dynamic-page/dynamic-page').then((m) => m.DynamicPage),
    title: dynamicPageResolver,
    resolve: { seo: seoDynamicPageResolver, schema: schemaDynamicPageResolver },
  },
  { path: '**', redirectTo: '' },
];
