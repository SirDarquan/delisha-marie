import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequestMock } from './test-utils';
import configRouter from './config';

describe('configRouter', () => {
  let request: ReturnType<typeof createRequestMock>;

  beforeEach(() => {
    request = createRequestMock(configRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the config data', async () => {
    const response = await request(null).get('/config');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('GoogleTagManager');
    expect(response.body).toHaveProperty('Sentry');
  });

  it('should return 404 for non-GET methods', async () => {
    const response = await request(null).post('/config').send();
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
