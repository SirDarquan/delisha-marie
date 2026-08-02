import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import configRouter from './config';

describe('configRouter', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', configRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the config data', async () => {
    const response = await request(app).get('/config');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('GoogleTagManager');
    expect(response.body).toHaveProperty('Sentry');
  });
});
