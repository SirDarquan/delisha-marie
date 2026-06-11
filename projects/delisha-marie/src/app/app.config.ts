import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './services/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
      }),
    ),
    provideTitleStrategy(TemplatePageTitleStrategy),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          if (req.url.includes('/api/recipes')) {
            const mockUrl = '/api/recipes.json';
            return next(req.clone({ url: mockUrl }));
          }

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
