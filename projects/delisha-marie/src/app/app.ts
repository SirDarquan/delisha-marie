import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, Scroll } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';

@Component({
  selector: 'dm-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div class="flex flex-col min-h-screen bg-[var(--mat-sys-surface)]">
      <dm-header />
      <main class="flex-grow container mx-auto px-4 py-8">
        <router-outlet />
      </main>
      <dm-footer />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly viewportScroller = inject(ViewportScroller);

  constructor() {
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
