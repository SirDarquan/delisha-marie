import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, RouterOutlet],
  template: `
    <div class="flex flex-col min-h-screen min-h-[100dvh] w-full box-border">
      <dm-header class="w-full shrink-0 z-10" />
      <main class="flex-1 flex flex-col w-full min-h-0">
        <router-outlet />
      </main>
      <dm-footer class="w-full shrink-0 mt-auto z-10" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 100dvh;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
