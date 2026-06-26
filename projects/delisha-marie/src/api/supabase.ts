import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function resetSupabaseClient(): void {
  supabaseClient = null;
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (!supabaseClient) {
    const supabaseUrl = process.env['SUPABASE_URL'] || '';
    const supabaseKey =
      process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_KEY'] || '';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required. Check environment variables.');
    }
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}
