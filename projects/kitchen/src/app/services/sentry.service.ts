import { inject, Service } from '@angular/core';
import { AppPlugin } from '@dm/library';
import { AppConfigService } from './config.service';

@Service()
export class SentryPlugin implements AppPlugin {
  private readonly appConfigService = inject(AppConfigService);
  readonly id = 'sentry';
  readonly order = 5;

  async init() {
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
