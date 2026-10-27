import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { Home } from './pages/home/home';
import { dynamicPageResolver } from './resolvers/dynamic-page.resolver';

describe('app.routes', () => {
  it('should define routes for home, contact, dynamic :slug, and wildcard', async () => {
    expect(routes).toHaveLength(4);

    // Home route
    expect(routes[0].path).toBe('');
    expect(routes[0].component).toBe(Home);
    expect(routes[0].pathMatch).toBe('full');

    // Contact route
    expect(routes[1].path).toBe('contact');
    const contactComponent = await (routes[1].loadComponent as () => Promise<unknown>)();
    expect(contactComponent).toBeDefined();

    // Dynamic :slug route (handles /about and any home:slug page)
    expect(routes[2].path).toBe(':slug');
    expect(routes[2].title).toBe(dynamicPageResolver);
    const dynamicPageComponent = await (routes[2].loadComponent as () => Promise<unknown>)();
    expect(dynamicPageComponent).toBeDefined();

    // Wildcard fallback
    expect(routes[3].path).toBe('**');
    expect(routes[3].redirectTo).toBe('');
  }, 40000);
});
