import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js');
import { createClient } from '@supabase/supabase-js';

// 2. Ensure Env vars exist for static initialization
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
  process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-key';
});

// 3. Import the implementation
import type { SupabaseClient } from '@supabase/supabase-js';
import { BackendSupabaseService } from './supabase-backend.service';

describe('BackendSupabaseService', () => {
  let service: BackendSupabaseService;

  beforeEach(() => {
    vi.clearAllMocks(); 
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_KEY', 'test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    
    // Explicitly mock the createClient return value for each test
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(),
      },
    } as any);

    service = new BackendSupabaseService();
    // Override internal client to prevent pollution
    service.supabase = {
      auth: {
        getUser: vi.fn(),
      },
    } as unknown as typeof service.supabase;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('verifyToken', () => {
    it('should retrieve and return a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockGetUser = vi.mocked(service.supabase.auth.getUser);
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null } as unknown as Awaited<
        ReturnType<typeof service.supabase.auth.getUser>
      >);

      const user = await service.verifyToken('test-token');

      expect(mockGetUser).toHaveBeenCalledWith('test-token');
      expect(user).toEqual(mockUser);
    });

    it('should propagate error if user fetch fails', async () => {
      const mockGetUser = vi.mocked(service.supabase.auth.getUser);
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      } as unknown as Awaited<ReturnType<typeof service.supabase.auth.getUser>>);

      await expect(service.verifyToken('bad-token')).rejects.toThrow('Auth failed');
    });
  });

  describe('getClient', () => {
    it('should return native client when token is omitted', () => {
      const client = service.getClient();
      expect(client).toBe(service.supabase);
    });

    it('should return a new SupabaseClient when token is provided', () => {
      const client = service.getClient('some-custom-jwt');
      expect(client).toBeTruthy();
      expect(client).not.toBe(service.supabase);
    });
  });

  describe('getters', () => {
    it('should initialize supabase', () => {
      service['_supabase'] = null as unknown as SupabaseClient;
      const client = service.supabase;
      expect(client).toBeDefined();
    });

    it('should initialize supabaseAdmin', () => {
      service['_supabaseAdmin'] = null as unknown as SupabaseClient;
      const client = service.supabaseAdmin;
      expect(client).toBeDefined();
    });

    it('should cache supabase', () => {
      service['_supabase'] = null as unknown as SupabaseClient;
      const client1 = service.supabase;
      const client2 = service.supabase;
      expect(client1).toBe(client2);
    });

    it('should cache supabaseAdmin', () => {
      service['_supabaseAdmin'] = null as unknown as SupabaseClient;
      const client1 = service.supabaseAdmin;
      const client2 = service.supabaseAdmin;
      expect(client1).toBe(client2);
    });
  });

  describe('lazy client initialization', () => {
    it('should lazily create standard and admin clients', () => {
      const freshService = new BackendSupabaseService();
      expect(freshService.supabase).toBeDefined();
      expect(freshService.supabaseAdmin).toBeDefined();
    });

    it('should fall back to class instance properties when environment variables are deleted', () => {
      const freshService = new BackendSupabaseService();

      const origUrl = process.env['SUPABASE_URL'];
      const origKey = process.env['SUPABASE_KEY'];
      const origRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

      delete process.env['SUPABASE_URL'];
      delete process.env['SUPABASE_KEY'];
      delete process.env['SUPABASE_SERVICE_ROLE_KEY'];

      try {
        expect(freshService.supabase).toBeDefined();
        expect(freshService.supabaseAdmin).toBeDefined();
      } finally {
        process.env['SUPABASE_URL'] = origUrl;
        process.env['SUPABASE_KEY'] = origKey;
        process.env['SUPABASE_SERVICE_ROLE_KEY'] = origRoleKey;
      }
    });

    it('should fall back to SUPABASE_KEY when SUPABASE_SERVICE_ROLE_KEY is deleted', () => {
      const freshService = new BackendSupabaseService();
      const origRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
      delete process.env['SUPABASE_SERVICE_ROLE_KEY'];

      try {
        expect(freshService.supabaseAdmin).toBeDefined();
      } finally {
        process.env['SUPABASE_SERVICE_ROLE_KEY'] = origRoleKey;
      }
    });
  });
});
