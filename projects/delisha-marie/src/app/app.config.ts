import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  provideExperimentalWebMcpTools,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './services/title.strategy';
import { withRecipes } from './webmcp';

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
    provideHttpClient(withInterceptors([])),
    provideExperimentalWebMcpTools(withRecipes()),
  ],
};
