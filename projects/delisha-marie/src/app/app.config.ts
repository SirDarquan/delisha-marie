import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './services/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideTitleStrategy(TemplatePageTitleStrategy),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req, next) => {
          if (req.url.includes('/api/recipes')) {
            const mockUrl = '/api/recipes.json';
            return next(req.clone({ url: mockUrl }));
          }
          if (req.url.includes('/api/recipe-index')) {
            const mockUrl = '/api/recipe-index.json';
            return next(req.clone({ url: mockUrl }));
          }
          return next(req);
        },
      ]),
    ),
  ],
};
