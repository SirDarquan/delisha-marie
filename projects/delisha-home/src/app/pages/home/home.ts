import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'dm-home',
  imports: [NgOptimizedImage],
  template: `
    <section
      class="hero-section relative flex-1 flex items-center justify-center w-full px-4 sm:px-6 md:px-8 py-2 overflow-hidden box-border"
      aria-label="Delisha Marie Portrait">
      <div
        class="image-wrapper relative flex items-center justify-center overflow-hidden rounded-lg shadow-2xl transition-all duration-200 ease-out">
        <img
          ngSrc="/delisha-marie.jpg"
          alt="Delisha Marie sitting in an armchair with her coffee"
          class="hero-image h-full w-full max-h-full object-cover object-[center_12%] block"
          priority
          fill />
        <div
          class="image-overlay absolute inset-0 pointer-events-none rounded-lg shadow-[inset_0_0_35px_10px_rgba(15,13,12,0.5)]"></div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 0 auto;
      width: 100%;
    }

    .hero-section {
      --hero-h: calc(100dvh - 9.5rem);
      height: var(--hero-h);
      min-height: var(--hero-h);
      container-type: inline-size;
    }

    .image-wrapper {
      width: 100%;
      max-width: min(100%, calc(var(--hero-h) * 16 / 9));
      height: min(var(--hero-h), calc(100cqw * 5 / 3));
      max-height: 100%;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
