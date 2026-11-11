import { HttpClient } from '@angular/common/http';
import { Injectable, inject, makeStateKey, signal, TransferState } from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';
import { AppPlugin } from '@dm/library';

export const APP_CONFIG_STATE_KEY = makeStateKey<AppConfig>('APP_CONFIG_STATE');

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

@Injectable({
  providedIn: 'root',
})
export class AppConfigService implements AppPlugin {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);

  readonly id = 'AppConfigService';
  readonly order = 1;

  /**
   * Holds the fully resolved application configuration after loading completes.
   */
  readonly config = signal<AppConfig | null>(null);

  /**
   * Loads the application configuration from the /config endpoint.
   * Called by APP_INITIALIZER during Angular bootstrap phase.
   */
  async init(): Promise<void> {
    if (this.transferState.hasKey(APP_CONFIG_STATE_KEY)) {
      const cached = this.transferState.get(APP_CONFIG_STATE_KEY, null);
      this.transferState.remove(APP_CONFIG_STATE_KEY);
      if (cached) {
        this.config.set(cached);
        return;
      }
    }

    try {
      const data = await firstValueFrom(
        this.http
          .get<AppConfig>('/config')
          .pipe(tap((val) => this.transferState.set(APP_CONFIG_STATE_KEY, val))),
      );
      this.config.set(data);
    } catch (error) {
      console.error('CRITICAL: Failed to fetch application configuration from Express!', error);
      // Setting a baseline fallback or throwing might crash the app intentionally.
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
