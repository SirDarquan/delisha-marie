import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink],
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
        <a
          mat-button
          [href]="kitchenUrl"
          class="!text-base sm:!text-lg !font-medium !text-white hover:!text-[#ffb952] transition-colors tracking-wide">
          <mat-icon class="mr-1.5 !text-[#ffb952]">restaurant_menu</mat-icon>
          Kitchen
        </a>
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
  readonly kitchenUrl = getKitchenUrl();
}
