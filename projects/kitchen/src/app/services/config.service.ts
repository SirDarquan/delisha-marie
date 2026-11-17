import { inject, signal, Service } from '@angular/core';
import { AppPlugin } from '@dm/library';
import { Api } from './api';

export interface AppConfig {
  GoogleTagManager: {
    id: string;
    gtm_auth?: string;
    gtm_preview?: string;
    gtm_resource_path?: string;
    gtm_csp_none?: string;
    gtm_mode?: string;
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

  KitchenHome?: {
    featuredRecipes: string[];
    kitchen_about: string;
    sidebar_about: string;
  };
}

@Service()
export class AppConfigService implements AppPlugin {
  private readonly api = inject(Api);

  readonly id = 'AppConfigService';
  readonly order = 1;

  /**
   * Holds the fully resolved application configuration after loading completes.
   */
  readonly config = signal<AppConfig | null>(null);

  /**
   * Loads the application configuration from the /config endpoint using the Api service.
   * Called by APP_INITIALIZER during Angular bootstrap phase.
   */
  async init(): Promise<void> {
    try {
      const data = await this.api.get<AppConfig>('/config');
      this.config.set(data);
    } catch (error) {
      console.error('CRITICAL: Failed to fetch application configuration!', error);
      throw error;
    }
  }

  GoogleTagManagerConfig() {
    return this.config()?.GoogleTagManager;
  }

  SentryConfig() {
    return this.config()?.Sentry;
  }

  KitchenHomeConfig() {
    return this.config()?.KitchenHome;
  }
}
