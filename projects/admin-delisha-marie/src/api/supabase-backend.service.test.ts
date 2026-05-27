import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn(),
      },
    })),
  };
});

// 2. Ensure Env vars exist for static initialization
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

// 3. Import the implementation
import { BackendSupabaseService } from './supabase-backend.service';

describe('BackendSupabaseService', () => {
  let service: BackendSupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BackendSupabaseService();
    // Explicitly override internal client with hermetic mock instance
    // to prevent mock pollution/collision from other parallel spec files.
    service.supabase = {
      auth: {
        getUser: vi.fn(),
      },
    } as unknown as typeof service.supabase;
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

  describe('lazy client initialization', () => {
    it('should lazily create standard and admin clients', () => {
      const freshService = new BackendSupabaseService();
      expect(freshService.supabase).toBeDefined();
      expect(freshService.supabaseAdmin).toBeDefined();
    });
  });
});
