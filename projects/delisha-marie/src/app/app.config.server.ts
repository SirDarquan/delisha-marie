import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes, withAppShell } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { vercelAbsoluteUrlInterceptor } from './interceptors/vercel-absolute-url';
import { AppShell } from './app-shell/app-shell';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes), withAppShell(AppShell)),
    provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
