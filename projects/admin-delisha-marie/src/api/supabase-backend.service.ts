import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class BackendSupabaseService {
  private _supabase: SupabaseClient | null = null;
  private _supabaseAdmin: SupabaseClient | null = null;
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

  public get supabaseAdmin(): SupabaseClient {
    if (!this._supabaseAdmin) {
      const url = process.env['SUPABASE_URL'] || this.supabaseUrl;
      // Prefer service role key for administrative functions
      const key =
        process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_KEY'] || this.supabaseKey;
      this._supabaseAdmin = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }
    return this._supabaseAdmin;
  }

  public set supabaseAdmin(val: SupabaseClient) {
    this._supabaseAdmin = val;
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
