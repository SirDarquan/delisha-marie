import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import {
  recipeListTitleResolver,
  recipeResolver,
  recipeTitleResolver,
} from './resolvers/recipe.resolver';
import { schemaDynamicPageResolver, schemaResolver } from './resolvers/schema.resolver';
import { schemaRecipeResolver } from './resolvers/recipe-schema.resolver';
import {
  seoDynamicPageResolver,
  seoRecipeListResolver,
  seoResolver,
} from './resolvers/seo.resolver';
import { seoRecipeResolver } from './resolvers/recipe-seo.resolver';
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
      image: 'delisha_marie_hero_widescreen.png',
      imageType: 'image/png',
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
      image: 'delisha_marie_profile.png',
      imageType: 'image/png',
    },
  },
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
    path: 'tag',
    title: 'Tag Not Found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
    resolve: { seo: seoResolver },
    data: { content: 'noindex,nofollow', itemType: 'tag', title: 'Tag Not Found' },
  },
  {
    path: 'recipe/:slug/print',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-print/recipe-print').then((m) => m.RecipePrint),
    resolve: { recipe: recipeResolver },
    data: { content: 'noindex,nofollow' },
  },
  {
    path: 'recipe/:slug',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-detail/recipe-detail').then((m) => m.RecipeDetail),
    resolve: {
      seo: seoRecipeResolver,
      schema: schemaRecipeResolver,
    },
  },
  {
    path: 'recipe/:slug/page/:page',
    title: recipeTitleResolver,
    loadComponent: () => import('./pages/recipe-detail/recipe-detail').then((m) => m.RecipeDetail),
    resolve: {
      seo: seoRecipeResolver,
      schema: schemaRecipeResolver,
    },
  },
  {
    path: 'recipe',
    title: 'Recipe Not Found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
    resolve: { seo: seoResolver },
    data: { content: 'noindex,nofollow', itemType: 'recipe', title: 'Recipe Not Found' },
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search').then((m) => m.SearchPage),
    title: 'Search Recipes',
    resolve: { seo: seoResolver, schema: schemaResolver },
    data: {
      description: 'Search for semantic matches across all Delisha Marie recipes.',
      keywords: ['recipe search', 'find recipe'],
      content: 'noindex,nofollow',
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
      content: 'noindex,nofollow',
    },
  },
  {
    path: 'thank-you',
    loadComponent: () => import('./pages/thank-you/thank-you').then((m) => m.ThankYouPage),
    title: dynamicPageResolver,
    resolve: { seo: seoDynamicPageResolver, schema: schemaDynamicPageResolver },
    data: { slug: 'thank-you', content: 'noindex,nofollow' },
  },
  ...['faq', 'privacy-policy'].flatMap((slug) => [
    {
      path: slug,
      loadComponent: () => import('./pages/dynamic-page/dynamic-page').then((m) => m.DynamicPage),
      title: dynamicPageResolver,
      resolve: { seo: seoDynamicPageResolver, schema: schemaDynamicPageResolver },
      data: { slug },
    },
  ]),
  {
    path: '404',
    title: 'Page Not Found',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
    resolve: { seo: seoResolver },
    data: {
      title: 'Page Not Found',
      itemType: 'page',
      description:
        "Sorry, this page doesn't exist or has moved. Something is always cooking in Delisha Marie's Kitchen!",
      content: 'noindex,nofollow',
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
    resolve: { seo: seoResolver },
    data: { content: 'noindex,nofollow' },
  },
];
