import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, Footer],
  template: `
    <div class="home-container">
      <dm-header class="home-header" />

      <main class="home-main" role="main">
        <div class="image-wrapper">
          <img
            src="/delisha-marie.jpg"
            alt="Delisha Marie sitting in an armchair with her coffee"
            class="hero-image object-cover"
            loading="eager"
            fetchpriority="high" />
          <div class="image-overlay"></div>
        </div>
      </main>

      <dm-footer class="home-footer" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .home-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;
      box-sizing: border-box;
    }

    .home-header {
      width: 100%;
      flex-shrink: 0;
      z-index: 10;
    }

    .home-main {
      position: relative;
      flex: 1 1 0%;
      min-height: 0;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
      padding: 0.5rem 1rem;
      container-type: size;
    }

    .image-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);

      /* Stage 1: As big as it can be up to full 16:9 width */
      width: 100%;
      max-width: min(100%, calc(100cqh * 16 / 9));

      /* Stage 2 & 3: Stretches full height while caving in, then scales down once down to her shoulders */
      height: 100%;
      height: min(100%, calc(100cqw * 5 / 3));
      max-height: 100%;
    }

    @media (max-width: 600px) {
      .image-wrapper {
        height: min(100%, calc(92vw * 5 / 3));
      }
    }

    .hero-image {
      height: 100%;
      width: 100%;
      max-height: 100%;
      object-fit: cover;
      object-position: center 12%;
      display: block;
    }

    .image-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      box-shadow: inset 0 0 35px 10px rgba(15, 13, 12, 0.5);
      border-radius: 8px;
    }

    .home-footer {
      width: 100%;
      flex-shrink: 0;
      z-index: 10;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
