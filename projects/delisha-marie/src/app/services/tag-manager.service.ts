import { DOCUMENT, inject, Service } from '@angular/core';
import { AppPlugin } from '@dm/library';
import { AppConfigService } from './config.service';

interface GtmWindow extends Window {
  ENV?: {
    GOOGLE_TAG_MANAGER_ID?: string;
  };
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

@Service()
export class GoogleTagManagerPlugin implements AppPlugin {
  readonly document = inject(DOCUMENT);
  readonly configService = inject(AppConfigService);

  readonly id = 'gtm';
  readonly order = 10;

  isEnabled(): boolean {
    // Always return true so the plugin registry runs our init().
    // If we check the config here, it will fail because AppConfigService.init()
    // hasn't finished fetching the HTTP request yet.
    return true;
  }

  async init() {
    const window = this.document.defaultView as GtmWindow | null;
    if (!window) return;

    // At this point, AppConfigService.init() has completed because its order (1)
    // is lower than our order (10) and PluginRegistry awaits sequentially!
    const gtmConfig = this.configService.GoogleTagManagerConfig();
    const id = gtmConfig?.id;
    if (!id) return;

    try {
      await this.loadScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
      window.dataLayer = window.dataLayer || [];

      // Standard GTM push function
      window.gtag = function (...args: unknown[]) {
        window.dataLayer!.push(args);
      };

      window.gtag('js', new Date());
      window.gtag('config', id, { anonymize_ip: true });
    } catch (e) {
      console.warn('GTM Script failed to load', e);
    }
  }

  private readonly loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      this.document.head.prepend(script);

      // Prevent hanging in Cypress or environments that block external scripts indefinitely
      setTimeout(() => reject(new Error('GTM timeout')), 3000);
    });
}
