import { inject, PLATFORM_ID, Service } from '@angular/core';
import { AppPlugin } from '@dm/library';
import { AppConfigService } from './config.service';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class SentryPlugin implements AppPlugin {
  private readonly appConfigService = inject(AppConfigService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly id = 'sentry';
  readonly order = 5;

  async init() {
    if (!isPlatformBrowser(this.platformId)) return; // skip SSR

    const sentryConfig = this.appConfigService.SentryConfig();

    if (!sentryConfig) return;

    const Sentry = await import('@sentry/browser');
    Sentry.init({
      dsn: sentryConfig.dsn,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: sentryConfig.tracesSampleRate,
      tracePropagationTargets: sentryConfig.tracePropagationTargets,
      replaysSessionSampleRate: sentryConfig.replaySessionSampleRate,
      replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
      environment: sentryConfig.environment,
      release: sentryConfig.release,
      debug: sentryConfig.debug,
    });
  }
}
