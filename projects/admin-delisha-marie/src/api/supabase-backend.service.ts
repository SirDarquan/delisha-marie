import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class BackendSupabaseService {
  public supabase: SupabaseClient;
  private readonly supabaseUrl = process.env['SUPABASE_URL'] || '';
  private readonly supabaseKey = process.env['SUPABASE_KEY'] || '';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }

  public getClient(token?: string): SupabaseClient {
    if (token) {
      return createClient(this.supabaseUrl, this.supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    }
    return this.supabase;
  }
}

export const backendService = new BackendSupabaseService();
