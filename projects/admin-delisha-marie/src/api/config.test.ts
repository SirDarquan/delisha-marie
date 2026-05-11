import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Config Router API', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.resetModules();
    // Setup some env variables BEFORE importing the router, so they get captured.
    process.env['GOOGLE_CLIENT_ID'] = 'test-env-google-client-xyz';

    // Import router AFTER process.env is mocked
    const configRouter = (await import('./config')).default;

    app = express();
    app.use(express.json());
    app.use('/', configRouter);
  });

  it('should return the configuration from environment variables', async () => {
    const res = await request(app).get('/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      SocialClients: {
        GoogleClientId: 'test-env-google-client-xyz',
      },
    });
  });
});
