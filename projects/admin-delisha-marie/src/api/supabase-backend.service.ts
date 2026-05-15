import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class BackendSupabaseService {
  private _supabase: SupabaseClient | null = null;
  private readonly supabaseUrl = process.env['SUPABASE_URL'] || '';
  private readonly supabaseKey = process.env['SUPABASE_KEY'] || '';

  public get supabase(): SupabaseClient {
    if (!this._supabase) {
      const url = process.env['SUPABASE_URL'] || this.supabaseUrl;
      const key = process.env['SUPABASE_KEY'] || this.supabaseKey;
      this._supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }
    return this._supabase;
  }

  public set supabase(val: SupabaseClient) {
    this._supabase = val;
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
