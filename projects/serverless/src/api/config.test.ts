import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequestMock } from './test-utils';
import configRouter, { DEFAULT_KITCHEN_HOME_SETTINGS } from './config';
import { resetSupabaseClient } from './supabase';

vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

describe('configRouter', () => {
  let request: ReturnType<typeof createRequestMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
    request = createRequestMock(configRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the config data with default KitchenHome when no site_settings found', async () => {
    const mockEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('GoogleTagManager');
    expect(response.body).toHaveProperty('Sentry');
    expect(response.body.KitchenHome).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
  });

  it('should return config data with parsed KitchenHome from site_settings', async () => {
    const customKitchenHome = {
      featuredRecipes: ['/recipes/custom-1', '/recipes/custom-2', '/recipes/custom-3'],
      kitchen_about: 'delisha_custom.webp',
      sidebar_about: 'sidebar_custom.webp',
    };

    const mockEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { value: JSON.stringify(customKitchenHome) },
        error: null,
      }),
    });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body.KitchenHome).toEqual(customKitchenHome);
  });

  it('should return config data when data.value in site_settings is already an object', async () => {
    const customKitchenHome = {
      featuredRecipes: ['/recipes/a', '/recipes/b', '/recipes/c'],
      kitchen_about: 'pic_a.webp',
      sidebar_about: 'pic_b.webp',
    };

    const mockEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { value: customKitchenHome },
        error: null,
      }),
    });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body.KitchenHome).toEqual(customKitchenHome);
  });

  it('should fall back gracefully to default KitchenHome on Supabase error', async () => {
    const mockEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockRejectedValue(new Error('Supabase unreachable')),
    });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body.KitchenHome).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
  });

  it('should return 404 for non-GET methods', async () => {
    const response = await request(null).post('/config').send();
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
