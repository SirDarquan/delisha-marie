import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, Scroll, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { NgClass } from '@angular/common';

@Component({
  selector: 'dm-root',
  imports: [RouterOutlet, Header, Footer, NgClass],
  template: `
    <div
      class="flex flex-col min-h-screen"
      [ngClass]="isPrintPage() ? 'bg-white' : 'bg-[var(--mat-sys-surface)]'">
      @if (!isPrintPage()) {
        <dm-header />
      }
      <main class="flex-grow" [ngClass]="isPrintPage() ? '' : 'container mx-auto px-4 py-8'">
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
  readonly isPrintPage = signal(false);

  constructor() {
    const router = inject(Router);
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.isPrintPage.set(router.url.includes('/print'));
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
