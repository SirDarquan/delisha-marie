import { Provider } from '@angular/core';
import { APP_PLUGINS } from '@dm/library';
import { GoogleTagManagerPlugin } from '../services/tag-manager.service';

export function provideGtm(): Provider {
  return [
    {
      provide: APP_PLUGINS,
      useClass: GoogleTagManagerPlugin,
      multi: true,
    },
  ];
}
