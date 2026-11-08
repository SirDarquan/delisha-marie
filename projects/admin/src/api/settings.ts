import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import { backendService } from './supabase-backend.service';

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

export const DEFAULT_KITCHEN_HOME_SETTINGS: KitchenHomeSettings = {
  featuredRecipes: ['', '', ''],
  kitchen_about: 'delisha_marie_profile_2.png',
  sidebar_about: 'delisha_marie_profile.png',
};

const settingsRouter = Router();

settingsRouter.use(authMiddleware);

// GET /api/settings/kitchen-home
settingsRouter.get(
  '/settings/kitchen-home',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const client = backendService.getClient(req.token);
      let query = client.from('site_settings').select('value').eq('key', 'kitchen_home');

      if (req.tenantId) {
        query = query.eq('tenant_id', req.tenantId);
      } else {
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      if (!data?.value) {
        res.json(DEFAULT_KITCHEN_HOME_SETTINGS);
        return;
      }

      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      res.json({ ...DEFAULT_KITCHEN_HOME_SETTINGS, ...parsed });
    } catch (err) {
      console.error('Failed to get kitchen-home settings:', err);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  },
);

// PUT /api/settings/kitchen-home
settingsRouter.put(
  '/settings/kitchen-home',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { featuredRecipes, kitchen_about, sidebar_about } = req.body || {};

      const payload: KitchenHomeSettings = {
        featuredRecipes: Array.isArray(featuredRecipes)
          ? featuredRecipes.slice(0, 3)
          : ['', '', ''],
        kitchen_about:
          typeof kitchen_about === 'string' && kitchen_about.trim()
            ? kitchen_about.trim()
            : DEFAULT_KITCHEN_HOME_SETTINGS.kitchen_about,
        sidebar_about:
          typeof sidebar_about === 'string' && sidebar_about.trim()
            ? sidebar_about.trim()
            : DEFAULT_KITCHEN_HOME_SETTINGS.sidebar_about,
      };

      const client = backendService.getClient(req.token);
      const tenantId = req.tenantId || null;

      let findQuery = client.from('site_settings').select('id').eq('key', 'kitchen_home');
      if (tenantId) {
        findQuery = findQuery.eq('tenant_id', tenantId);
      } else {
        findQuery = findQuery.is('tenant_id', null);
      }

      const { data: existing, error: findError } = await findQuery.maybeSingle();
      if (findError) throw findError;

      const now = new Date().toISOString();

      if (existing) {
        let updateQuery = client
          .from('site_settings')
          .update({ value: JSON.stringify(payload), updated_at: now })
          .eq('id', existing.id);
        if (tenantId) {
          updateQuery = updateQuery.eq('tenant_id', tenantId);
        } else {
          updateQuery = updateQuery.is('tenant_id', null);
        }
        const { error } = await updateQuery;
        if (error) throw error;
      } else {
        const { error } = await client.from('site_settings').insert({
          key: 'kitchen_home',
          value: JSON.stringify(payload),
          tenant_id: tenantId,
          created_at: now,
          updated_at: now,
        });
        if (error) throw error;
      }

      res.json({ success: true, settings: payload });
    } catch (err) {
      console.error('Failed to save kitchen-home settings:', err);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  },
);

export default settingsRouter;
