import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, Signal, effect } from '@angular/core';
import { Router, RouterOutlet, Scroll } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ViewportScroller } from '@angular/common';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

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
    const scrollingPosition: Signal<[number, number] | undefined> = toSignal(
      inject(Router).events.pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        map((event: Scroll) => event.position || [0, 0]),
      ))

    effect(() => {
      if (scrollingPosition()) {
        this.viewportScroller.scrollToPosition(scrollingPosition()!);
      }
    });
  }

}
