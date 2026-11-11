import { VercelRequest, VercelResponse } from '@vercel/node';

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

export const DEFAULT_KITCHEN_HOME_SETTINGS: KitchenHomeSettings = {
  featuredRecipes: process.env['KITCHEN_FEATURED_RECIPES']
    ? process.env['KITCHEN_FEATURED_RECIPES']
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['/recipes/breakfast', '/recipes/lunch', '/recipes/dinner'],
  kitchen_about: process.env['KITCHEN_ABOUT_PICTURE'] || 'delisha_marie_profile_2.png',
  sidebar_about: process.env['SIDEBAR_ABOUT_PICTURE'] || 'delisha_marie_profile.png',
};

export const getKitchenHomeSettings = (): KitchenHomeSettings => {
  const envRecipes = process.env['KITCHEN_FEATURED_RECIPES'];
  return {
    featuredRecipes: envRecipes
      ? envRecipes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_KITCHEN_HOME_SETTINGS.featuredRecipes,
    kitchen_about:
      process.env['KITCHEN_ABOUT_PICTURE'] || DEFAULT_KITCHEN_HOME_SETTINGS.kitchen_about,
    sidebar_about:
      process.env['SIDEBAR_ABOUT_PICTURE'] || DEFAULT_KITCHEN_HOME_SETTINGS.sidebar_about,
  };
};

export interface AppConfig {
  GoogleTagManager: {
    id?: string;
  };
  Sentry?: {
    dsn: string;
    tracesSampleRate: number;
    tracePropagationTargets: string[];
    replaySessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    environment?: string;
    release?: string;
    debug?: boolean;
  };
  KitchenHome?: KitchenHomeSettings;
}

const configHandler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  if (req.method !== 'GET') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const responseConfig: AppConfig = {
    GoogleTagManager: {
      id: process.env['GTM_ID'],
    },
    Sentry: {
      dsn: process.env['SENTRY_DSN']!,
      tracesSampleRate: Number.parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
      tracePropagationTargets: process.env['SENTRY_TRACE_PROPAGATION_TARGETS']?.split(',') ?? [
        'localhost:4200',
      ],
      replaySessionSampleRate: Number.parseFloat(
        process.env['SENTRY_REPLAY_SESSION_SAMPLE_RATE'] ?? '0.1',
      ),
      replaysOnErrorSampleRate: Number.parseFloat(
        process.env['SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE'] ?? '1.0',
      ),
      environment: process.env['SENTRY_ENVIRONMENT'],
      release: process.env['SENTRY_RELEASE'],
      debug: process.env['SENTRY_DEBUG'] === 'true',
    },
    KitchenHome: getKitchenHomeSettings(),
  };

  res.status(200).json(responseConfig);
};

export default configHandler;
