import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// 1. Explicitly declare mock functions outside to track calls
const { mockGetUser, mockFrom, mockSelect, mockOrder, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
}));

// 2. Setup the chain linkages
const chain = {
  from: mockFrom,
  select: mockSelect,
  order: mockOrder,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
  single: mockSingle,
};

// 3. Mock the supabase client globally
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// 4. Ensure Env vars exist for static initialization
process.env['SUPABASE_URL'] = 'https://example.supabase.co';
process.env['SUPABASE_KEY'] = 'test-key';

// 5. Dynamically import the implementation after hooks are setup
import { BackendSupabaseService } from './supabase-backend.service';
import { createClient } from '@supabase/supabase-js';

describe('BackendSupabaseService', () => {
  let service: BackendSupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default chain return values before each test run
    mockFrom.mockReturnValue(chain);
    mockSelect.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockInsert.mockReturnValue(chain);
    mockUpdate.mockReturnValue(chain);
    mockDelete.mockReturnValue(chain);
    mockEq.mockReturnValue(chain);
    mockSingle.mockReturnValue(chain);
    
    // Ensure createClient implementation persists
    createClient.mockImplementation(() => ({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }));

    service = new BackendSupabaseService();
  });

  afterEach(() => {
    vi.resetAllMocks();
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

  describe('CRUD Operations', () => {
    it('should fetch recipes with explicit token header overrides', async () => {
      const mockData = [{ id: 1, title: 'Recipe 1' }];
      // Simulate client order() returning resolved promise
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const recipes = await service.getRecipes('fake-token');

      // Should trigger a second createClient via getClient()
      expect(createClient).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(recipes).toEqual(mockData);
    });

    it('should propagate error on fetch failure', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('Db crash') });
      await expect(service.getRecipes()).rejects.toThrow('Db crash');
    });

    it('should create recipes by single insertion', async () => {
      const payload = { title: 'New' };
      const result = { ...payload, id: 2 };
      mockSingle.mockResolvedValue({ data: result, error: null });

      const out = await service.createRecipe(payload);

      expect(mockInsert).toHaveBeenCalledWith(payload);
      expect(out).toEqual(result);
    });

    it('should throw exception on create failure', async () => {
      mockSingle.mockResolvedValue({ data: null, error: 'Creation Error' });
      await expect(service.createRecipe({})).rejects.toBe('Creation Error');
    });

    it('should update specific recipe by ID', async () => {
      const result = { id: '1', title: 'Updated' };
      mockSingle.mockResolvedValue({ data: result, error: null });

      const out = await service.updateRecipe('1', { title: 'Updated' }, 'tok');

      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Updated' });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(out).toEqual(result);
    });

    it('should throw on update error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: 'Update fail' });
      await expect(service.updateRecipe('x', {})).rejects.toBe('Update fail');
    });

    it('should delete recipe with proper ID match', async () => {
      // Delete is not single-chained, returns from eq()
      mockEq.mockResolvedValue({ error: null });

      await service.deleteRecipe('99', 'tok');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '99');
    });

    it('should throw on delete failure', async () => {
      mockEq.mockResolvedValue({ error: new Error('Delete lock') });
      await expect(service.deleteRecipe('x')).rejects.toThrow('Delete lock');
    });
  });
});
