import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  ViewEncapsulation,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, Scroll } from '@angular/router';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { filter } from 'rxjs';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';

@Component({
  selector: 'dm-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div
      class="flex flex-col min-h-screen"
      [class.bg-white]="isPrintPage()"
      [class.bg-[var(--mat-sys-surface)]]="!isPrintPage()">
      @if (!isPrintPage()) {
        <dm-header />
      }
      <main
        class="flex-grow"
        [class.container]="!isPrintPage()"
        [class.mx-auto]="!isPrintPage()"
        [class.px-4]="!isPrintPage()"
        [class.py-8]="!isPrintPage()">
        <router-outlet />
      </main>
      @if (!isPrintPage()) {
        <dm-footer />
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly gtmService = inject(GoogleTagManagerService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly isPrintPage = signal(false);
  constructor() {
    const router = inject(Router);

    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.isPrintPage.set(router.url.includes('/print'));

      // Push page view event to GTM only in browser
      if (isPlatformBrowser(this.platformId)) {
        this.gtmService
          .pushTag({
            event: 'page',
            pageName: (event as NavigationEnd).url,
          })
          .catch((err) => {
            console.warn('Failed to push GTM tag:', err);
          });
      }
    });

    const scrollEvent = toSignal(
      inject(Router).events.pipe(filter((event): event is Scroll => event instanceof Scroll)),
    );

    effect(() => {
      const ev = scrollEvent();
      if (ev) {
        if (ev.position) {
          this.viewportScroller.scrollToPosition(ev.position);
        } else if (ev.anchor) {
          this.viewportScroller.scrollToAnchor(ev.anchor);
        }
      }
    });
  }
}
