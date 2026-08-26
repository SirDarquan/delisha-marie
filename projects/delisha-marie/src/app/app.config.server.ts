import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { vercelAbsoluteUrlInterceptor } from './interceptors/vercel-absolute-url.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([vercelAbsoluteUrlInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
