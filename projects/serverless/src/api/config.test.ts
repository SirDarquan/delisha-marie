import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequestMock } from './test-utils';
import configRouter, { DEFAULT_KITCHEN_HOME_SETTINGS } from './config';

describe('configRouter', () => {
  let request: ReturnType<typeof createRequestMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = createRequestMock(configRouter);
  });

  it('should return the config data with KitchenHome settings', async () => {
    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('GoogleTagManager');
    expect(response.body).toHaveProperty('Sentry');
    expect(response.body.KitchenHome).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
  });

  it('should return custom KitchenHome settings when env vars are set', async () => {
    const originalFeatured = process.env['KITCHEN_FEATURED_RECIPES'];
    const originalAbout = process.env['KITCHEN_ABOUT_PICTURE'];
    const originalSidebar = process.env['SIDEBAR_ABOUT_PICTURE'];

    process.env['KITCHEN_FEATURED_RECIPES'] = 'recipe-1, recipe-2, recipe-3';
    process.env['KITCHEN_ABOUT_PICTURE'] = 'custom_about.png';
    process.env['SIDEBAR_ABOUT_PICTURE'] = 'custom_sidebar.png';

    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body.KitchenHome).toEqual({
      featuredRecipes: ['recipe-1', 'recipe-2', 'recipe-3'],
      kitchen_about: 'custom_about.png',
      sidebar_about: 'custom_sidebar.png',
    });

    if (originalFeatured !== undefined) {
      process.env['KITCHEN_FEATURED_RECIPES'] = originalFeatured;
    } else {
      delete process.env['KITCHEN_FEATURED_RECIPES'];
    }
    if (originalAbout !== undefined) {
      process.env['KITCHEN_ABOUT_PICTURE'] = originalAbout;
    } else {
      delete process.env['KITCHEN_ABOUT_PICTURE'];
    }
    if (originalSidebar !== undefined) {
      process.env['SIDEBAR_ABOUT_PICTURE'] = originalSidebar;
    } else {
      delete process.env['SIDEBAR_ABOUT_PICTURE'];
    }
  });

  it('should return 404 for non-GET methods', async () => {
    const response = await request(null).post('/config').send();
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
