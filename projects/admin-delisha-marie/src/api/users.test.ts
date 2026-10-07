import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { backendService } from './supabase-backend.service';
import usersRouter from './users';

describe('Users API Router (Admin & Waiting Room)', () => {
  let app: express.Express;

  const mockAdminUser = { id: 'admin-id-1', email: 'sirdarquan@gmail.com' } as unknown as User;
  const mockMemberUser = { id: 'member-id-1', email: 'member@example.com' } as unknown as User;

  let mockFromData: Record<string, unknown> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockFromData = {};

    // Mock verifyToken
    vi.spyOn(backendService, 'verifyToken').mockImplementation(async (token: string) => {
      if (token === 'admin-token') return mockAdminUser;
      if (token === 'member-token') return mockMemberUser;
      throw new Error('Invalid token');
    });

    const createQueryBuilder = () => {
      const qb: Record<string, unknown> = {};

      qb['select'] = vi.fn().mockImplementation(() => qb);

      qb['order'] = vi.fn().mockImplementation(() => {
        if (mockFromData['order_error']) {
          return { data: null, error: mockFromData['order_error'] };
        }
        return {
          data: mockFromData['select_data'] ?? [],
          error: null,
        };
      });

      qb['eq'] = vi.fn().mockImplementation((col: string, val: unknown) => {
        if (col === 'user_id' && val === 'admin-id-1') {
          return {
            ...qb,
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin', status: 'active' },
              error: null,
            }),
          };
        }
        if (col === 'user_id' && val === 'member-id-1') {
          return {
            ...qb,
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'member', status: 'active' },
              error: null,
            }),
          };
        }
        if (col === 'status' && val === 'pending') {
          return {
            ...qb,
            order: vi.fn().mockImplementation(() => {
              if (mockFromData['pending_error']) {
                return { data: null, error: mockFromData['pending_error'] };
              }
              return {
                data: mockFromData['pending_data'] ?? [],
                error: null,
              };
            }),
          };
        }
        return qb;
      });

      qb['or'] = vi.fn().mockImplementation(() => qb);

      qb['single'] = vi.fn().mockImplementation(() => {
        if (mockFromData['single_error']) {
          return { data: null, error: mockFromData['single_error'] };
        }
        return { data: mockFromData['single_data'] ?? null, error: null };
      });

      qb['maybeSingle'] = vi.fn().mockImplementation(() => {
        if (mockFromData['maybeSingle_error']) {
          return { data: null, error: mockFromData['maybeSingle_error'] };
        }
        return { data: mockFromData['maybeSingle_data'] ?? null, error: null };
      });

      qb['insert'] = vi.fn().mockImplementation((payload: unknown) => {
        if (mockFromData['insert_error']) {
          return { data: null, error: mockFromData['insert_error'] };
        }
        return {
          data: payload,
          error: null,
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: payload,
              error: null,
            }),
          }),
        };
      });

      qb['update'] = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => {
          if (mockFromData['update_error']) {
            return {
              data: null,
              error: mockFromData['update_error'],
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: null,
                  error: mockFromData['update_error'],
                }),
              }),
            };
          }
          return {
            data: null,
            error: null,
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { id: 'tenant-1', name: 'Updated' },
                error: null,
              }),
            }),
          };
        }),
        or: vi.fn().mockImplementation(() => {
          if (mockFromData['update_error']) {
            return { data: null, error: mockFromData['update_error'] };
          }
          return { data: null, error: null };
        }),
      }));

      qb['then'] = (resolve: (v: unknown) => void) => {
        if (mockFromData['tenants_error']) {
          return resolve({ data: null, error: mockFromData['tenants_error'] });
        }
        return resolve({
          data: mockFromData['tenants_data'] ?? [],
          error: null,
        });
      };

      return qb;
    };

    backendService.supabaseAdmin = {
      from: vi.fn().mockImplementation(() => createQueryBuilder()),
      auth: {
        admin: {
          generateLink: vi.fn().mockImplementation(async () => {
            if (mockFromData['generateLink_error']) {
              return { data: null, error: mockFromData['generateLink_error'] };
            }
            if (mockFromData['no_token_hash']) {
              return { data: { properties: {} }, error: null };
            }
            return {
              data: { properties: { hashed_token: 'valid-hashed-token' } },
              error: null,
            };
          }),
        },
      },
    } as unknown as typeof backendService.supabaseAdmin;

    backendService.supabase = {
      auth: {
        verifyOtp: vi.fn().mockImplementation(async () => {
          if (mockFromData['verifyOtp_error']) {
            return { data: null, error: mockFromData['verifyOtp_error'] };
          }
          if (mockFromData['no_session']) {
            return { data: {}, error: null };
          }
          return {
            data: {
              session: { access_token: 'impersonated-session-token', expires_in: 3600 },
              user: { id: 'member-id-1', email: 'member@example.com' },
            },
            error: null,
          };
        }),
      },
    } as unknown as typeof backendService.supabase;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(usersRouter);
  });

  describe('GET /admin/users', () => {
    it('should return all users with their tenant information for admin', async () => {
      mockFromData['select_data'] = [
        {
          id: 'p1',
          user_id: 'member-id-1',
          email: 'member@example.com',
          role: 'member',
          status: 'active',
          created_at: '2026-10-07T00:00:00Z',
        },
        {
          id: 'p2',
          user_id: 'no-tenant-user',
          email: 'notenant@example.com',
          role: 'member',
          status: 'active',
          created_at: '2026-10-07T00:00:00Z',
        },
      ];
      mockFromData['tenants_data'] = [{ id: 't1', name: 'Member Tenant', owner_id: 'member-id-1' }];

      const res = await request(app)
        .get('/admin/users')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body.users[0].tenant).toEqual({
        id: 't1',
        name: 'Member Tenant',
        owner_id: 'member-id-1',
      });
      expect(res.body.users[1].tenant).toBeNull();
    });

    it('should return 403 when a non-admin attempts to access /admin/users', async () => {
      const res = await request(app)
        .get('/admin/users')
        .set('Cookie', ['admin_access_token=member-token']);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Admin access required');
    });

    it('should return 500 when fetching profiles fails', async () => {
      mockFromData['order_error'] = new Error('Database connection failed');

      const res = await request(app)
        .get('/admin/users')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database connection failed');
    });

    it('should return 500 when fetching tenants fails (with string error)', async () => {
      mockFromData['select_data'] = [];
      mockFromData['tenants_error'] = 'Tenant query failed string';

      const res = await request(app)
        .get('/admin/users')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Tenant query failed string');
    });
  });

  describe('GET /admin/waiting-room', () => {
    it('should return pending users for admin', async () => {
      mockFromData['pending_data'] = [
        { id: 'p-pending', email: 'newbie@example.com', status: 'pending' },
      ];

      const res = await request(app)
        .get('/admin/waiting-room')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.pendingUsers).toHaveLength(1);
    });

    it('should handle pendingUsers being empty / undefined', async () => {
      mockFromData['pending_data'] = null;

      const res = await request(app)
        .get('/admin/waiting-room')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.pendingUsers).toEqual([]);
    });

    it('should return 500 when fetching waiting room fails', async () => {
      mockFromData['pending_error'] = new Error('Failed to query waiting room');

      const res = await request(app)
        .get('/admin/waiting-room')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to query waiting room');
    });
  });

  describe('POST /admin/users/:id/approve', () => {
    it('should reject approval if role is missing', async () => {
      const res = await request(app)
        .post('/admin/users/p-new/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Role must be either 'member' or 'admin'");
    });

    it('should reject approval if role is invalid', async () => {
      const res = await request(app)
        .post('/admin/users/p-new/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'superhero' });

      expect(res.status).toBe(400);
    });

    it('should return 404 if user profile is not found', async () => {
      mockFromData['single_data'] = null;

      const res = await request(app)
        .post('/admin/users/not-found-id/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'member' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('User profile not found');
    });

    it('should approve user as member with custom slug and customDomain', async () => {
      mockFromData['single_data'] = {
        id: 'p-new',
        user_id: 'user-new',
        email: 'chef@example.com',
        status: 'pending',
      };

      const res = await request(app)
        .post('/admin/users/p-new/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({
          role: 'member',
          tenantName: "Chef's Table",
          slug: 'chefs-table',
          customDomain: 'chef.delisha-marie.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('approved as member');
    });

    it('should fallback slug and kitchen name if not provided', async () => {
      mockFromData['single_data'] = {
        id: 'p-new2',
        user_id: 'user-new2',
        email: 'baker@example.com',
        status: 'pending',
      };

      const res = await request(app)
        .post('/admin/users/p-new2/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 if tenant insertion fails', async () => {
      mockFromData['single_data'] = {
        id: 'p-new3',
        user_id: 'user-new3',
        email: 'test@example.com',
        status: 'pending',
      };
      mockFromData['insert_error'] = new Error('Duplicate tenant slug');

      const res = await request(app)
        .post('/admin/users/p-new3/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'member' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Duplicate tenant slug');
    });

    it('should return 500 if profile update fails', async () => {
      mockFromData['single_data'] = {
        id: 'p-new4',
        user_id: 'user-new4',
        email: 'test@example.com',
        status: 'pending',
      };
      mockFromData['update_error'] = new Error('Profile update constraint violation');

      const res = await request(app)
        .post('/admin/users/p-new4/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'member' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Profile update constraint violation');
    });

    it('should approve user as admin without provisioning tenant', async () => {
      mockFromData['single_data'] = {
        id: 'p-new-admin',
        user_id: 'user-new-admin',
        email: 'coadmin@example.com',
        status: 'pending',
      };

      const res = await request(app)
        .post('/admin/users/p-new-admin/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('approved as admin');
    });
  });

  describe('POST /admin/users/:id/block and unblock', () => {
    it('should return 404 when blocking non-existent user', async () => {
      mockFromData['single_data'] = null;

      const res = await request(app)
        .post('/admin/users/not-found/block')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('User profile not found');
    });

    it('should reject blocking an administrator', async () => {
      mockFromData['single_data'] = {
        id: 'p-admin',
        user_id: 'user-admin',
        email: 'boss@example.com',
        role: 'admin',
      };

      const res = await request(app)
        .post('/admin/users/p-admin/block')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot block an administrator');
    });

    it('should block a member successfully', async () => {
      mockFromData['single_data'] = {
        id: 'p-bad',
        user_id: 'user-bad',
        email: 'spammer@example.com',
        role: 'member',
      };

      const res = await request(app)
        .post('/admin/users/p-bad/block')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User has been blocked');
    });

    it('should return 500 when blocking update fails', async () => {
      mockFromData['single_data'] = {
        id: 'p-bad2',
        user_id: 'user-bad2',
        email: 'bad2@example.com',
        role: 'member',
      };
      mockFromData['update_error'] = new Error('Database block error');

      const res = await request(app)
        .post('/admin/users/p-bad2/block')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database block error');
    });

    it('should unblock a user successfully', async () => {
      const res = await request(app)
        .post('/admin/users/p-bad/unblock')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User unblocked');
    });

    it('should return 500 when unblocking fails', async () => {
      mockFromData['update_error'] = new Error('Database unblock error');

      const res = await request(app)
        .post('/admin/users/p-bad/unblock')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database unblock error');
    });
  });

  describe('Passwordless Impersonation & Exit', () => {
    it('should return 404 when impersonating non-existent user', async () => {
      mockFromData['single_data'] = null;

      const res = await request(app)
        .post('/admin/users/unknown/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should reject impersonating another admin', async () => {
      mockFromData['single_data'] = {
        id: 'p-admin2',
        user_id: 'admin2',
        email: 'admin2@example.com',
        role: 'admin',
        status: 'active',
      };

      const res = await request(app)
        .post('/admin/users/p-admin2/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot impersonate another administrator');
    });

    it('should reject impersonating a pending or blocked user', async () => {
      mockFromData['single_data'] = {
        id: 'p-pending',
        user_id: 'pending1',
        email: 'pending@example.com',
        role: 'member',
        status: 'pending',
      };

      const res = await request(app)
        .post('/admin/users/p-pending/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot impersonate user with status 'pending'");
    });

    it('should allow admin to impersonate a member and set cookies', async () => {
      mockFromData['single_data'] = {
        id: 'p-member',
        user_id: 'member-id-1',
        email: 'member@example.com',
        role: 'member',
        status: 'active',
      };

      const res = await request(app)
        .post('/admin/users/p-member/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Now impersonating');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('admin_original_token=admin-token'))).toBe(
        true,
      );
      expect(
        cookies.some((c: string) => c.includes('admin_access_token=impersonated-session-token')),
      ).toBe(true);
    });

    it('should return 500 when generateLink fails', async () => {
      mockFromData['single_data'] = {
        id: 'p-member',
        user_id: 'member-id-1',
        email: 'member@example.com',
        role: 'member',
        status: 'active',
      };
      mockFromData['generateLink_error'] = new Error('Auth service unreachable');

      const res = await request(app)
        .post('/admin/users/p-member/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Auth service unreachable');
    });

    it('should return 500 when tokenHash is missing', async () => {
      mockFromData['single_data'] = {
        id: 'p-member',
        user_id: 'member-id-1',
        email: 'member@example.com',
        role: 'member',
        status: 'active',
      };
      mockFromData['no_token_hash'] = true;

      const res = await request(app)
        .post('/admin/users/p-member/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to generate verification token');
    });

    it('should return 500 when verifyOtp fails', async () => {
      mockFromData['single_data'] = {
        id: 'p-member',
        user_id: 'member-id-1',
        email: 'member@example.com',
        role: 'member',
        status: 'active',
      };
      mockFromData['verifyOtp_error'] = new Error('OTP verification rejected');

      const res = await request(app)
        .post('/admin/users/p-member/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('OTP verification rejected');
    });

    it('should return 500 when sessionData has no session', async () => {
      mockFromData['single_data'] = {
        id: 'p-member',
        user_id: 'member-id-1',
        email: 'member@example.com',
        role: 'member',
        status: 'active',
      };
      mockFromData['no_session'] = true;

      const res = await request(app)
        .post('/admin/users/p-member/impersonate')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to establish member session');
    });

    it('should allow exiting impersonation back to admin', async () => {
      const res = await request(app)
        .post('/auth/exit-impersonation')
        .set('Cookie', [
          'admin_original_token=original-admin-jwt',
          'admin_access_token=member-jwt',
        ]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes('admin_access_token=original-admin-jwt'))).toBe(
        true,
      );
    });

    it('should return 400 when exiting impersonation without active impersonation cookie', async () => {
      const res = await request(app).post('/auth/exit-impersonation');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No active impersonation session found');
    });
  });

  describe('PUT /admin/tenants/:id', () => {
    it('should update tenant configuration with all fields provided', async () => {
      const res = await request(app)
        .put('/admin/tenants/t1')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({
          name: 'New Tenant Name',
          slug: 'new-slug',
          customDomain: 'recipes.example.com',
          isPublic: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update tenant with null customDomain when empty string provided', async () => {
      const res = await request(app)
        .put('/admin/tenants/t1')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ customDomain: '' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update tenant when body has no fields', async () => {
      const res = await request(app)
        .put('/admin/tenants/t1')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 when tenant update fails', async () => {
      mockFromData['update_error'] = new Error('Database tenant update failed');

      const res = await request(app)
        .put('/admin/tenants/t1')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ name: 'Failing Name' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database tenant update failed');
    });
  });

  describe('GET /auth/session', () => {
    it('should return the current session context', async () => {
      const res = await request(app)
        .get('/auth/session')
        .set('Cookie', ['admin_access_token=admin-token']);

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(mockAdminUser);
      expect(res.body.role).toBe('admin');
    });
  });

  describe('Additional Slug and Auth Fallbacks', () => {
    it('should fallback to member slug when email has empty localpart', async () => {
      mockFromData['single_data'] = {
        id: 'p-empty-local',
        user_id: 'user-empty-local',
        email: '@domain.com',
        status: 'pending',
      };

      const res = await request(app)
        .post('/admin/users/p-empty-local/approve')
        .set('Cookie', ['admin_access_token=admin-token'])
        .send({ role: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
