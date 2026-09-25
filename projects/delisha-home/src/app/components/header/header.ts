import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  template: `
    <mat-toolbar
      class="header-toolbar w-full !bg-black/35 backdrop-blur-md h-20 px-8 md:px-16 lg:px-24 xl:px-32 flex justify-between items-center border-b border-white/15 !text-white transition-all">
      <a class="flex items-center cursor-pointer logo-container" routerLink="/">
        <div class="logo-word">
          <span class="logo-letter-bold !text-[#ffb952]">D</span>
          <span class="logo-letter-fade !text-white">elisha</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold !text-[#ffb952]">M</span>
          <span class="logo-letter-fade !text-white">arie</span>
        </div>
      </a>

      <span class="spacer"></span>

      <nav class="flex items-center gap-2 sm:gap-4 md:gap-6">
        <a
          mat-button
          routerLink="/about"
          class="!text-base sm:!text-lg !font-medium !text-white hover:!text-[#ffb952] transition-colors tracking-wide">
          About
        </a>
        <a
          mat-button
          routerLink="/contact"
          class="!text-base sm:!text-lg !font-medium !text-white hover:!text-[#ffb952] transition-colors tracking-wide">
          Contact
        </a>
        <button
          mat-button
          type="button"
          (click)="onKitchenClick($event)"
          matTooltip="Coming soon"
          aria-label="Kitchen - Coming soon"
          class="!text-base sm:!text-lg !font-medium !text-white/60 hover:!text-white/80 cursor-not-allowed transition-colors tracking-wide">
          <mat-icon class="mr-1.5 !text-[#ffb952]/60">restaurant_menu</mat-icon>
          Kitchen
        </button>
      </nav>
    </mat-toolbar>
  `,
  styles: `
    .header-toolbar {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly snackBar = inject(MatSnackBar);

  readonly kitchenUrl = getKitchenUrl();

  onKitchenClick(event: Event): void {
    event.preventDefault();
    this.snackBar.open('Coming soon', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
