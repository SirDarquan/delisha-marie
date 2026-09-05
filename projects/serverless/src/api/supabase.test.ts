import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient, resetSupabaseClient } from './supabase';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    mockClient: true,
  })),
}));

describe('Supabase Client Manager', () => {
  const originalUrl = process.env['SUPABASE_URL'];
  const originalKey = process.env['SUPABASE_KEY'];

  beforeEach(() => {
    resetSupabaseClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetSupabaseClient();
    vi.clearAllMocks();
    if (originalUrl !== undefined) process.env['SUPABASE_URL'] = originalUrl;
    else delete process.env['SUPABASE_URL'];
    if (originalKey !== undefined) process.env['SUPABASE_KEY'] = originalKey;
    else delete process.env['SUPABASE_KEY'];
  });

  it('should initialize and return a supabase client when env vars are present', async () => {
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key-123';

    const client = await getSupabaseClient();
    expect(client).toBeDefined();
    expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-key-123');
  });

  it('should return the cached client instance on subsequent calls', async () => {
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key-123';

    const client1 = await getSupabaseClient();
    const client2 = await getSupabaseClient();

    expect(client1).toBe(client2);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when SUPABASE_URL is missing', async () => {
    delete process.env['SUPABASE_URL'];
    process.env['SUPABASE_KEY'] = 'test-key-123';

    await expect(getSupabaseClient()).rejects.toThrow('Supabase URL and Key are required');
  });

  it('should throw an error when SUPABASE_KEY is missing', async () => {
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    delete process.env['SUPABASE_KEY'];

    await expect(getSupabaseClient()).rejects.toThrow('Supabase URL and Key are required');
  });

  it('should re-create client after resetSupabaseClient is called', async () => {
    process.env['SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key-123';

    await getSupabaseClient();
    resetSupabaseClient();
    await getSupabaseClient();

    expect(createClient).toHaveBeenCalledTimes(2);
  });
});
