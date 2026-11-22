import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';
import { CookieService } from '../cookie/cookie.service';

const THEME_COOKIE_NAME = 'theme';
const THEME_COOKIE_MAX_AGE = 31536000; // 1 year in seconds

@Service()
export class ThemeService {
  readonly document = inject(DOCUMENT);
  private readonly cookieService = inject(CookieService);

  // Signal to track the current theme
  readonly isDark = signal<boolean>(this.getInitialTheme());

  // Effect to update the document class and cookie when theme changes
  private readonly _themeEffect = effect(() => {
    const dark = this.isDark();
    this.document.documentElement?.classList.toggle('dark-theme', dark);
    this.cookieService.set(THEME_COOKIE_NAME, dark ? 'dark' : 'light', {
      maxAge: THEME_COOKIE_MAX_AGE,
    });
  });

  toggle() {
    this.isDark.update((v) => !v);
  }

  private getInitialTheme(): boolean {
    return this.cookieService.get(THEME_COOKIE_NAME) === 'dark';
  }
}
