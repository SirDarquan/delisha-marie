import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  mergeApplicationConfig,
  provideAppInitializer,
} from '@angular/core';
import { provideServerRendering, withAppShell, withRoutes } from '@angular/ssr';
import { AppShell } from './app-shell/app-shell';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { vercelAbsoluteUrlInterceptor } from './interceptors/vercel-absolute-url';
import { AppConfigService } from './services/config.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell)),
    provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
    provideAppInitializer(() => inject(AppConfigService).init()),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
