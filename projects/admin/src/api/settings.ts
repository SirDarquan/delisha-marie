import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

export const DEFAULT_KITCHEN_HOME_SETTINGS: KitchenHomeSettings = {
  featuredRecipes: process.env['KITCHEN_FEATURED_RECIPES']
    ? process.env['KITCHEN_FEATURED_RECIPES'].split(',').map((s) => s.trim())
    : ['', '', ''],
  kitchen_about: process.env['KITCHEN_ABOUT_PICTURE'] || 'delisha_marie_profile_2.png',
  sidebar_about: process.env['SIDEBAR_ABOUT_PICTURE'] || 'delisha_marie_profile.png',
};

const settingsRouter = Router();

settingsRouter.use(authMiddleware);

// GET /api/settings/kitchen-home
settingsRouter.get('/settings/kitchen-home', (_req: AuthRequest, res: Response): void => {
  res.json(DEFAULT_KITCHEN_HOME_SETTINGS);
});

export default settingsRouter;
