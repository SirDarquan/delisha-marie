import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_PLUGINS, AppPlugin } from '../../core/plugins/plugin.token';

export interface SocialClients {
  GoogleClientId?: string;
  AmazonClientId?: string;
  FacebookClientId?: string;
  VKClientId?: string;
  MicrosoftClientId?: string;
}

export interface AppConfig {
  SocialClients: SocialClients;
  DescopeProjectId?: string;
}

export const provideAppConfig = () => [
  { provide: APP_PLUGINS, useExisting: AppConfigService, multi: true },
];

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
  private readonly config = signal<AppConfig | null>(null);

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

  SocialClients() {
    return this.config()?.SocialClients;
  }

  DescopeProjectId() {
    return this.config()?.DescopeProjectId;
  }
}
