import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { Home } from './pages/home/home';

describe('app.routes', () => {
  it('should define routes for home, about, contact, and wildcard', async () => {
    expect(routes).toHaveLength(4);

    // Home route
    expect(routes[0].path).toBe('');
    expect(routes[0].component).toBe(Home);
    expect(routes[0].pathMatch).toBe('full');

    // About route
    expect(routes[1].path).toBe('about');
    const aboutComponent = await (routes[1].loadComponent as () => Promise<unknown>)();
    expect(aboutComponent).toBeDefined();

    // Contact route
    expect(routes[2].path).toBe('contact');
    const contactComponent = await (routes[2].loadComponent as () => Promise<unknown>)();
    expect(contactComponent).toBeDefined();

    // Wildcard fallback
    expect(routes[3].path).toBe('**');
    expect(routes[3].redirectTo).toBe('');
  }, 20000);
});
