import { ViewportScroller } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly isPrintPage = signal(false);

  private readonly _navSub = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      this.isPrintPage.set(this.router.url.includes('/print'));
    });

  private readonly scrollEvent = toSignal(
    this.router.events.pipe(filter((event): event is Scroll => event instanceof Scroll)),
  );

  private readonly _scrollEffect = effect(() => {
    const ev = this.scrollEvent();
    if (ev) {
      if (ev.position) {
        this.viewportScroller.scrollToPosition(ev.position);
      } else if (ev.anchor) {
        this.viewportScroller.scrollToAnchor(ev.anchor);
      }
    }
  });
}
