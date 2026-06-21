import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { routes } from './app.routes';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './services/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideTitleStrategy(TemplatePageTitleStrategy),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          if (req.url.includes('/api/comments')) {
            const mockUrl = '/api/comments.json';
            return next(req.clone({ url: mockUrl }));
          }
          return next(req);
        },
      ]),
    ),
  ],
};
