import {
  ApplicationConfig,
  Component,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideBaseHref } from './provider/base-href';

export const appConfigEx: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideBaseHref('/kitchen'),
  ],
};

@Component({
  selector: 'dm-root',
  template: '',
})
export class AppEx {}

export const KITCHEN_RELEASE_TIMESTAMP = new Date('2026-12-01T00:00:00Z').getTime();

export async function isKitchenReleased(fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchFn('/api/config', { method: 'HEAD' });
    const serverDateHeader = res.headers.get('date');
    if (!serverDateHeader) {
      return false;
    }

    return new Date(serverDateHeader).getTime() >= KITCHEN_RELEASE_TIMESTAMP;
  } catch {
    return false;
  }
}
