import { inject, InjectionToken, signal } from '@angular/core';

export const BRAND_TITLE_TOKEN = new InjectionToken<string>('brandTitle');

export function injectAuthCommon() {
  const brandTitle = inject(BRAND_TITLE_TOKEN, { optional: true }) || 'Admin Portal';
  const hidePassword = signal<boolean>(true);

  return {
    brandTitle,
    hidePassword,
    togglePassword: () => hidePassword.update((v) => !v),
  };
}
