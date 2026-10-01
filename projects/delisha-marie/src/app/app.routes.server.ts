import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // SEO-critical routes → SSR (resolvers fetch data at runtime on Vercel)
  { path: '', renderMode: RenderMode.Server },
  { path: 'recipe-index', renderMode: RenderMode.Server },
  { path: 'recipes', renderMode: RenderMode.Server },
  { path: 'recipes/**', renderMode: RenderMode.Server },
  { path: 'methods', renderMode: RenderMode.Server },
  { path: 'methods/**', renderMode: RenderMode.Server },
  { path: 'holidays', renderMode: RenderMode.Server },
  { path: 'holidays/**', renderMode: RenderMode.Server },
  { path: 'special-diets', renderMode: RenderMode.Server },
  { path: 'special-diets/**', renderMode: RenderMode.Server },
  { path: 'the-best-recipes', renderMode: RenderMode.Server },
  { path: 'the-best-recipes/**', renderMode: RenderMode.Server },
  { path: 'tag/**', renderMode: RenderMode.Server },
  { path: 'recipe/:slug', renderMode: RenderMode.Server },
  { path: 'recipe/:slug/page/:page', renderMode: RenderMode.Server },
  { path: ':slug', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },
  { path: 'search/page/:page', renderMode: RenderMode.Server },

  // Noindex / utility routes → CSR (no SEO value, skip server work)
  { path: 'recipe/:slug/print', renderMode: RenderMode.Client },
  { path: 'thank-you', renderMode: RenderMode.Client },

  // Fallback → CSR (this is where the app shell lives)
  { path: '**', renderMode: RenderMode.Client },
];
