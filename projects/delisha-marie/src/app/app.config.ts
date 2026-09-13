import { provideImageKitLoader } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideExperimentalWebMcpTools,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { PluginRegistry } from '@dm/library';
import { routes } from './app.routes';
import { provideAppConfig } from './provider/app-config';
import { provideBaseHref } from './provider/base-href';
import { provideSentry } from './provider/sentry';
import { provideGtm } from './provider/tag-manager';
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
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({ filter: (request) => request.method === 'GET' }),
    ),
    provideHttpClient(withInterceptors([])),
    provideExperimentalWebMcpTools(withRecipes()),
    provideImageKitLoader('https://ik.imagekit.io/delishamarie'),
    provideAppInitializer(() => inject(PluginRegistry).initAll()),
    provideAppConfig(),
    provideGtm(),
    provideSentry(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideBaseHref('/kitchen'),
  ],
};
