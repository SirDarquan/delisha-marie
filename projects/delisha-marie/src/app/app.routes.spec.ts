import { convertToParamMap, PartialMatchRouteSnapshot, Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

type CanMatchFn = (
  route: Route,
  segments: unknown[],
  snapshot: PartialMatchRouteSnapshot,
) => boolean;

const snapshotWith = (params: Record<string, string>) =>
  ({ queryParamMap: convertToParamMap(params) }) as unknown as PartialMatchRouteSnapshot;

describe('app routes', () => {
  const searchRoutes = routes.filter((r) => r.canMatch?.length);

  it('should define search routes at "" and "page/:page" guarded by canMatch', () => {
    expect(searchRoutes.map((r) => r.path)).toEqual(['', 'page/:page']);
  });

  for (const path of ['', 'page/:page']) {
    describe(`search route "${path}"`, () => {
      const route = searchRoutes.find((r) => r.path === path)!;
      const guard = route.canMatch![0] as CanMatchFn;

      it('should match when a q query param is present', () => {
        expect(guard(route, [], snapshotWith({ q: 'chicken' }))).toBe(true);
      });

      it('should not match when q is missing or empty', () => {
        expect(guard(route, [], snapshotWith({}))).toBe(false);
        expect(guard(route, [], snapshotWith({ q: '' }))).toBe(false);
      });

      it('should lazy load the SearchPage component', async () => {
        const component = await (route.loadComponent as () => Promise<unknown>)();
        expect(component).toBeDefined();
      });
    });
  }

  it('should lazy load all route components', async () => {
    const lazyRoutes = routes.filter((r) => typeof r.loadComponent === 'function');
    expect(lazyRoutes.length).toBeGreaterThan(0);

    for (const route of lazyRoutes) {
      const component = await (route.loadComponent as () => Promise<unknown>)();
      expect(component).toBeDefined();
    }
  }, 30000);

  it('should fall through to the Home route when not searching', () => {
    const home = routes.find((r) => r.path === '' && !r.canMatch);
    expect(home?.title).toBe('Home');
  });

  it('should no longer define a /search route', () => {
    expect(routes.some((r) => r.path?.startsWith('search'))).toBe(false);
  });
});
