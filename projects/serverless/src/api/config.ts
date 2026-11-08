import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

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

const appConfig: AppConfig = {
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
};

const configHandler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  if (req.method !== 'GET') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  let kitchenHome = DEFAULT_KITCHEN_HOME_SETTINGS;
  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'kitchen_home')
      .is('tenant_id', null)
      .maybeSingle();

    if (data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      kitchenHome = { ...DEFAULT_KITCHEN_HOME_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load kitchen_home from site_settings:', err);
  }

  res.status(200).json({
    ...appConfig,
    KitchenHome: kitchenHome,
  });
};

export default configHandler;
