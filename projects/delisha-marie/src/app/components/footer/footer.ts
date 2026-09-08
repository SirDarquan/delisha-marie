import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'dm-footer',
  imports: [RouterLink],
  template: `
    <footer
      class="py-12 px-4 border-t border-[var(--mat-sys-outline-variant)] bg-[var(--mat-sys-surface-container)]">
      <div
        class="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
          <a
            href="#"
            (click)="scrollToTop($event)"
            class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
            ^ Back to the top
          </a>
          <a
            routerLink="/"
            class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
            Home
          </a>
          <a
            routerLink="/recipes"
            class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
            Recipes
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
            routerLink="/faq"
            class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
            FAQ
          </a>
          <a
            routerLink="/privacy-policy"
            class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] text-sm font-medium transition-colors no-underline">
            Privacy Policy
          </a>
        </div>

        <div class="text-[var(--mat-sys-on-surface-variant)] text-xs">
          © {{ year }} Delisha Marie. Designed by The One.
        </div>
      </div>
    </footer>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly year = new Date().getFullYear();

  scrollToTop(event: Event): void {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
