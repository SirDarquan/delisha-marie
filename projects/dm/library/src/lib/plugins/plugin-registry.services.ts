import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, REQUEST, Service } from '@angular/core';
import { APP_PLUGINS } from './plugin.token';

@Service()
export class PluginRegistry {
  private readonly plugins = inject(APP_PLUGINS, { optional: true }) ?? [];
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  async initAll(isServer = false): Promise<void> {
    if (!isPlatformBrowser(this.platformId) && (!isServer || !this.request)) return;

    const eligible = this.plugins
      .filter((p) => p.isEnabled?.() || true)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    await eligible.reduce(async (prevPromise, plugin) => {
      await prevPromise;
      try {
        await Promise.resolve(plugin.init());
      } catch (err) {
        console.error(`Failed to initialize plugin ${plugin.id}`, err);
      }
    }, Promise.resolve());
  }
}
