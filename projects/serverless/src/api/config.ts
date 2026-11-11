import { VercelRequest, VercelResponse } from '@vercel/node';

export interface GoogleTagManagerSettings {
  id?: string;
}

export interface SentrySettings {
  dsn: string;
  tracesSampleRate: number;
  tracePropagationTargets: string[];
  replaySessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  environment?: string;
  release?: string;
  debug?: boolean;
}

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

export interface AppConfig {
  GoogleTagManager: GoogleTagManagerSettings;
  Sentry?: SentrySettings;
  KitchenHome: KitchenHomeSettings;
}

export const DEFAULT_KITCHEN_HOME_SETTINGS: KitchenHomeSettings = {
  featuredRecipes: process.env['KITCHEN_FEATURED_RECIPES']
    ? process.env['KITCHEN_FEATURED_RECIPES']
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['', '', ''],
  kitchen_about: process.env['KITCHEN_ABOUT_PICTURE'] || 'delisha_marie_profile_2.png',
  sidebar_about: process.env['SIDEBAR_ABOUT_PICTURE'] || 'delisha_marie_profile.png',
};

export const DEFAULT_GOOGLE_TAG_MANAGER_SETTINGS: GoogleTagManagerSettings = {
  id: process.env['GTM_ID'],
};

export const DEFAULT_SENTRY_SETTINGS: SentrySettings = {
  dsn: process.env['SENTRY_DSN']!,
  tracesSampleRate: Number.parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
  tracePropagationTargets: process.env['SENTRY_TRACE_PROPAGATION_TARGETS']?.split(',') ?? [
    'localhost:4201',
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
};

export const CONFIG: AppConfig = {
  GoogleTagManager: DEFAULT_GOOGLE_TAG_MANAGER_SETTINGS,
  Sentry: DEFAULT_SENTRY_SETTINGS,
  KitchenHome: DEFAULT_KITCHEN_HOME_SETTINGS,
};

const configHandler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }

  res.status(200).json(CONFIG);
};

export default configHandler;
