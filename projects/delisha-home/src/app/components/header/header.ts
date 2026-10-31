import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { HeaderNav, MenuLink } from '@dm/library';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-header',
  imports: [MatToolbarModule, RouterLink, HeaderNav],
  template: `
    <mat-toolbar
      class="header-toolbar w-full !bg-[var(--mat-sys-surface)]/80 backdrop-blur-md h-20 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 flex justify-between items-center border-b border-[var(--mat-sys-outline-variant)] transition-all">
      <a class="flex items-center cursor-pointer logo-container" routerLink="/">
        <div class="logo-word">
          <span class="logo-letter-bold">D</span>
          <span class="logo-letter-fade">elisha</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold">M</span>
          <span class="logo-letter-fade">arie</span>
        </div>
      </a>

      <span class="spacer"></span>

      <dml-header-nav [menuLinks]="menuLinks" />
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

  protected readonly menuLinks: MenuLink[] = [
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
    { externalUrl: this.kitchenUrl, label: 'Kitchen', icon: 'restaurant_menu' },
  ];
}
