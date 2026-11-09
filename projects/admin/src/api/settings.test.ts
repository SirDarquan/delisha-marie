import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import settingsRouter, { DEFAULT_KITCHEN_HOME_SETTINGS } from './settings';
import cookieParser from 'cookie-parser';
import { backendService } from './supabase-backend.service';

vi.spyOn(backendService, 'verifyToken');

describe('Admin Settings Router API', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(backendService.verifyToken).mockResolvedValue({
      id: 'test-user-id',
    } as unknown as import('@supabase/supabase-js').User);
    backendService.supabaseAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin', status: 'active' },
          error: null,
        }),
      }),
    } as unknown as typeof backendService.supabaseAdmin;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api', settingsRouter);
  });

  describe('GET /api/settings/kitchen-home', () => {
    it('should return 401 when request is not authenticated', async () => {
      const res = await request(app).get('/api/settings/kitchen-home');
      expect(res.status).toBe(401);
    });

    it('should return kitchen home settings when authenticated', async () => {
      const authedApp = express();
      authedApp.use(express.json());
      authedApp.use(cookieParser());
      authedApp.use((req, _res, next) => {
        req.cookies = { admin_access_token: 'test-token-xyz' };
        next();
      });
      authedApp.use('/api', settingsRouter);

      const res = await request(authedApp).get('/api/settings/kitchen-home');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(DEFAULT_KITCHEN_HOME_SETTINGS);
    });
  });
});
