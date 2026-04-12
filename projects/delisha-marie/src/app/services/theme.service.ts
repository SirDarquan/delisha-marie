import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  // Signal to track the current theme
  readonly isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Effect to update the document class when theme changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const dark = this.isDark();
        document.documentElement.classList.toggle('dark-theme', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      }
    });
  }

  toggle() {
    this.isDark.update((v) => !v);
  }

  private getInitialTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }
}
