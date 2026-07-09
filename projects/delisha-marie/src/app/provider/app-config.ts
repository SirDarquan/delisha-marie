import { APP_PLUGINS } from '@dm/library';
import { AppConfigService } from '../services/config.service';

export const provideAppConfig = () => [
  { provide: APP_PLUGINS, useExisting: AppConfigService, multi: true },
];
