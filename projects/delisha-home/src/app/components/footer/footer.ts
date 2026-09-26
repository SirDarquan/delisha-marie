import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-footer',
  imports: [RouterLink, MatTooltipModule],
  template: `
    <footer
      class="footer-bar w-full py-4 md:py-6 px-8 md:px-16 lg:px-24 xl:px-32 border-t border-white/15 bg-black/45 backdrop-blur-md text-white/90">
      <div class="footer-links flex flex-row items-center gap-6 md:gap-8">
        <a
          href="#"
          (click)="scrollToTop($event)"
          class="text-white/80 hover:text-[#ffb952] text-sm font-medium transition-colors no-underline">
          ^ Back to the top
        </a>
        <a
          routerLink="/about"
          class="text-white/80 hover:text-[#ffb952] text-sm font-medium transition-colors no-underline">
          About
        </a>
        <a
          routerLink="/contact"
          class="text-white/80 hover:text-[#ffb952] text-sm font-medium transition-colors no-underline">
          Contact
        </a>
        <button
          type="button"
          (click)="onKitchenClick($event)"
          matTooltip="Coming soon"
          aria-label="Kitchen - Coming soon"
          class="text-white/50 hover:text-white/70 text-sm font-medium transition-colors no-underline cursor-not-allowed bg-transparent border-none p-0 inline-flex items-center">
          Kitchen
        </button>
      </div>

      <div class="footer-copyright text-white/70 text-xs whitespace-nowrap">
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
  private readonly snackBar = inject(MatSnackBar);

  readonly year = new Date().getFullYear();
  readonly kitchenUrl = getKitchenUrl();

  scrollToTop(event: Event): void {
    event.preventDefault();
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onKitchenClick(event: Event): void {
    event.preventDefault();
    this.snackBar.open('Coming soon', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
