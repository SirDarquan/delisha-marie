import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. Explicitly declare mock functions outside to track calls
const {
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

// 2. Ensure Env vars exist for static initialization
vi.hoisted(() => {
  process.env['SUPABASE_URL'] = 'https://example.supabase.co';
  process.env['SUPABASE_KEY'] = 'test-key';
});

// 3. Import the implementation after environment variable setup
import { BackendSupabaseService } from './supabase-backend.service';

describe('BackendSupabaseService', () => {
  let service: BackendSupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Instantiate normally
    service = new BackendSupabaseService();

    // Explicitly assign mocked Supabase client instance to override the native constructor initialization
    service.supabase = {
      auth: { getUser: mockGetUser },
    } as any;
  });

  describe('verifyToken', () => {
    it('should retrieve and return a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const user = await service.verifyToken('test-token');

      expect(mockGetUser).toHaveBeenCalledWith('test-token');
      expect(user).toEqual(mockUser);
    });

    it('should propagate error if user fetch fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth failed') });

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
      // Verify properties on the instantiated SupabaseClient instance
      expect(client['supabaseUrl']).toBe('https://example.supabase.co');
      expect(client['supabaseKey']).toBe('test-key');
    });
  });
});
