import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { authGuard } from './guards/auth.guard';

describe('Admin App Routes', () => {
  it('should define expected number of routes and configuration', () => {
    expect(routes).toBeDefined();
    expect(routes).toHaveLength(15);
  });

  it('should protect administrative routes with authGuard', () => {
    const protectedPaths = [
      'pending-approval',
      'users',
      'recipes',
      'recipes/new',
      'pages',
      'pages/:slug',
      'recipes/edit/:id',
      'contacts',
      'contacts/page/:page',
      'contacts/:id',
      'recipes/:id/comments',
    ];

    for (const path of protectedPaths) {
      const route = routes.find((r) => r.path === path && r.canActivate);
      expect(route, `Expected route ${path} to exist with canActivate`).toBeDefined();
      expect(route?.canActivate).toContain(authGuard);
    }
  });

  it('should configure login without authGuard', () => {
    const loginRoute = routes.find((r) => r.path === 'login');
    expect(loginRoute).toBeDefined();
    expect(loginRoute?.canActivate).toBeUndefined();
  });

  it('should configure redirects for default and wildcard routes', () => {
    const defaultRedirect = routes.find((r) => r.path === '' && r.redirectTo !== undefined);
    expect(defaultRedirect).toBeDefined();
    expect(defaultRedirect?.pathMatch).toBe('full');
    expect(defaultRedirect?.redirectTo).toBe('');

    const wildcardRoute = routes.find((r) => r.path === '**');
    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.redirectTo).toBe('');
  });

  it('should lazy load all route components successfully', async () => {
    const lazyRoutes = routes.filter((r) => typeof r.loadComponent === 'function');
    expect(lazyRoutes).toHaveLength(13);

    for (const route of lazyRoutes) {
      const comp = await (route.loadComponent as () => Promise<unknown>)();
      expect(comp, `Failed to load component for route ${route.path}`).toBeDefined();
    }
  }, 45000);
});
