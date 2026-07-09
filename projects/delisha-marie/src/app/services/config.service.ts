import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppPlugin } from '@dm/library';

export interface AppConfig {
  GoogleTagManager: {
    id: string;
    gtm_auth?: string;
    gtm_preview?: string;
    gtm_resource_path?: string;
    gtm_csp_none?: string;
    gtm_mode?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AppConfigService implements AppPlugin {
  private readonly http = inject(HttpClient);

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
    try {
      const data = await firstValueFrom(this.http.get<AppConfig>('/config'));
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
}
