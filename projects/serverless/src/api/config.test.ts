import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequestMock } from './test-utils';
import configRouter, { DEFAULT_KITCHEN_HOME_SETTINGS } from './config';

describe('configRouter', () => {
  let request: ReturnType<typeof createRequestMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = createRequestMock(configRouter);
  });

  it('should return the config data with KitchenHome settings and environment', async () => {
    delete process.env['VERCEL_ENV'];
    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.headers['x-app-environment']).toBe('local');
    expect(response.body).toHaveProperty('GoogleTagManager');
    expect(response.body).toHaveProperty('Sentry');
    expect(response.body.KitchenHome).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
    expect(response.body).toHaveProperty('environment', 'local');
  });

  it('should return 200 and X-App-Environment header for HEAD method', async () => {
    const originalVercelEnv = process.env['VERCEL_ENV'];
    process.env['VERCEL_ENV'] = 'production';
    const { createMockRequest, createMockResponse } = await import('./test-utils');
    const req = createMockRequest('/config', 'HEAD');
    const res = createMockResponse();

    await configRouter(req, res as unknown as import('@vercel/node').VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith('X-App-Environment', 'live');
    expect(res.end).toHaveBeenCalled();

    if (originalVercelEnv === undefined) {
      delete process.env['VERCEL_ENV'];
    } else {
      process.env['VERCEL_ENV'] = originalVercelEnv;
    }
  });

  it('should return 404 for non-GET methods', async () => {
    const response = await request(null).post('/config').send();
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
