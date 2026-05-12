import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL'] || '';
const supabaseKey = process.env['SUPABASE_KEY'] || '';

export class BackendSupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
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

  private getClient(token?: string): SupabaseClient {
    if (token) {
      return createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    }
    return this.supabase;
  }

  async getRecipes(token?: string) {
    const { data, error } = await this.getClient(token)
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createRecipe(recipe: Record<string, unknown>, token?: string) {
    const { data, error } = await this.getClient(token)
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateRecipe(id: string, recipe: Record<string, unknown>, token?: string) {
    const { data, error } = await this.getClient(token)
      .from('recipes')
      .update(recipe)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRecipe(id: string, token?: string) {
    const { error } = await this.getClient(token).from('recipes').delete().eq('id', id);
    if (error) throw error;
  }
}

export const backendService = new BackendSupabaseService();
