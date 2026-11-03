import { Provider } from '@angular/core';
import { APP_PLUGINS } from '@dm/library';
import { SentryPlugin } from '../services/sentry.service';

export function provideSentry(): Provider {
  return [
    {
      provide: APP_PLUGINS,
      useClass: SentryPlugin,
      multi: true,
    },
  ];
}
