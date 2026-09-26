import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { AppEx, appConfigEx, isLive } from './app/coming-soon';

const options = (await isLive()) ? { app: App, config } : { app: AppEx, config: appConfigEx };
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(options.app, options.config, context);
export default bootstrap;
