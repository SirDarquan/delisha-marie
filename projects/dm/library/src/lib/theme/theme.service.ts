import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly platformId = inject(PLATFORM_ID);
  readonly document = inject(DOCUMENT);

  // Signal to track the current theme
  readonly isDark = signal<boolean>(this.getInitialTheme());

  // Effect to update the document class when theme changes
  private readonly _themeEffect = effect(() => {
    if (isPlatformBrowser(this.platformId)) {
      const dark = this.isDark();
      this.document.documentElement.classList.toggle('dark-theme', dark);
      const window = this.document.defaultView;
      if (!window) return;
      window.localStorage?.setItem('theme', dark ? 'dark' : 'light');
    }
  });

  toggle() {
    this.isDark.update((v) => !v);
  }

  private getInitialTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const window = this.document.defaultView;
      if (!window) return false;
      const saved = window.localStorage?.getItem('theme');
      if (saved) return saved === 'dark';
      const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      return media ? media.matches : false;
    }
    return false;
  }
}
