import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-footer',
  imports: [RouterLink],
  template: `
    <footer
      class="footer-bar w-full py-4 md:py-6 px-8 md:px-16 lg:px-24 xl:px-32 border-t border-[var(--mat-sys-outline-variant)] bg-[var(--mat-sys-surface-container)] backdrop-blur-md text-[var(--mat-sys-on-surface-variant)]">
      <div class="footer-links flex flex-row items-center gap-6 md:gap-8">
        <a
          href="#"
          (click)="scrollToTop($event)"
          class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
          ^ Back to the top
        </a>
        <a
          routerLink="/about"
          class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
          About
        </a>
        <a
          routerLink="/contact"
          class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
          Contact
        </a>
        <a
          [href]="kitchenUrl"
          class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
          Kitchen
        </a>
      </div>

      <div
        class="footer-copyright text-[var(--mat-sys-on-surface-variant)]/80 text-xs whitespace-nowrap">
        © {{ year }} Delisha Marie. Designed by The One.
      </div>
    </footer>
  `,
  styles: `
    .footer-bar {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding-left: 2rem;
      padding-right: 2rem;
    }
    @media (min-width: 768px) {
      .footer-bar {
        flex-direction: row;
        padding-left: 8rem;
        padding-right: 8rem;
      }
    }
    @media (min-width: 1280px) {
      .footer-bar {
        padding-left: 16rem;
        padding-right: 16rem;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly document = inject(DOCUMENT);

  readonly year = new Date().getFullYear();
  readonly kitchenUrl = getKitchenUrl();

  scrollToTop(event: Event): void {
    event.preventDefault();
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
