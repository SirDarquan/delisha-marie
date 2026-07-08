import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { APP_PLUGINS } from './plugin.token';

@Injectable({
  providedIn: 'root',
})
export class PluginRegistry {
  private readonly plugins = inject(APP_PLUGINS, { optional: true }) ?? [];
  private readonly platformId = inject(PLATFORM_ID);

  async initAll(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return; // skip SSR

    const eligible = this.plugins
      .filter((p) => p.isEnabled?.() || true)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const plugin of eligible) {
      try {
        await Promise.resolve(plugin.init());
      } catch (err) {
        console.error(`Failed to initialize plugin ${plugin.id}`, err);
      }
    }
  }
}
