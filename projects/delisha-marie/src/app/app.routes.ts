import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { seoResolver } from './resolvers/seo.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home',
    resolve: { seo: seoResolver },
    data: {
      description:
        'Discover authentic flavors and handcrafted recipes with Delisha Marie. Join our culinary journey for simple yet elegant dishes.',
      keywords: ['food blog', 'delisha marie', 'authentic recipes', 'home cooking', 'dallas food'],
      // breadcrumbs: [{ name: 'Home', item: '{{origin}}' }],
      schema: {
        '@type': 'CollectionPage',
        '@id': '{{origin}}/#webpage',
        isPartOf: { '@id': '{{origin}}/#website' },
        description: 'Authentic flavors, handcrafted with love by Delisha Marie.',
      },
    },
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.About),
    title: 'About',
    resolve: { seo: seoResolver },
    data: {
      description:
        'Learn about Delisha Marie, her culinary journey from family Sunday dinners to a lifelong passion for elevated simplicity in cooking.',
      keywords: ['delisha marie biography', 'culinary journey', 'cooking philosophy'],
      // breadcrumbs: [
      //   { name: 'Home', item: '{{origin}}' },
      //   { name: 'About', item: '{{origin}}/about' },
      // ],
      schema: {
        '@type': 'AboutPage',
        '@id': '{{origin}}/about/#webpage',
        isPartOf: { '@id': '{{origin}}/#website' },
        mainEntity: {
          '@type': 'Person',
          '@id': '{{origin}}/#person',
          name: 'Delisha Marie',
          description: 'Dallas-based cook and content creator.',
          image: {
            '@type': 'ImageObject',
            '@id': '{{origin}}/#author-image',
            url: '{{origin}}/assets/delisha-marie.jpg', // Placeholder
            caption: 'Delisha Marie',
          },
          sameAs: [
            'https://instagram.com/delisha-marie',
            'https://pinterest.com/delisha-marie',
            'https://youtube.com/@delisha-marie',
          ],
        },
      },
    },
  },
  {
    path: 'recipe-index',
    loadComponent: () => import('./pages/recipe-index/recipe-index').then((m) => m.RecipeIndex),
    title: 'Recipe Index',
    resolve: { seo: seoResolver },
    data: {
      description:
        'Explore Delisha Marie’s recipe index for handcrafted, seasonal recipes. Simple, elegant dishes for elevated home cooking.',
      keywords: ['recipe index', 'food categories', 'delisha marie masterlist'],
      breadcrumbs: [
        { name: 'Home', item: '{{origin}}' },
        { name: 'Recipe Index', item: '{{origin}}/recipe-index' },
      ],
    },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: 'Contact',
    resolve: { seo: seoResolver },
    data: {
      description:
        'Get in touch with Delisha Marie for recipe questions, collaborations, or just to say hi. Reach out via our studio in Dallas, TX.',
      keywords: ['contact delisha marie', 'recipe collaborations', 'dallas food studio'],
      // breadcrumbs: [
      //   { name: 'Home', item: '{{origin}}' },
      //   { name: 'Contact', item: '{{origin}}/contact' },
      // ],
      schema: {
        '@type': 'ContactPage',
        '@id': '{{origin}}/contact/#webpage',
        isPartOf: { '@id': '{{origin}}/#website' },
      },
    },
  },
  {
    path: 'tag/:id',
    loadComponent: () => import('./pages/tag/tag').then((m) => m.Tag),
    title: 'Tag Archive',
    resolve: { seo: seoResolver },
  },
  { path: '**', redirectTo: '' },
];
