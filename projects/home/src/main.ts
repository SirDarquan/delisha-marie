import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { initBotId } from 'botid/client/core';

inject();
injectSpeedInsights();
initBotId({
  protect: [
    {
      path: '/api/contacts',
      method: 'POST',
    },
  ],
});
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
