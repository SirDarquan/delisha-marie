import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HeaderNav, MenuLink } from '@dm/library';
import { getHomeUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-header',
  imports: [MatToolbarModule, HeaderNav],
  host: {
    class: 'sticky top-0 z-50 block',
  },
  template: `
    <mat-toolbar
      class="!bg-[var(--mat-sys-surface)]/80 backdrop-blur-md h-20 px-4 md:px-8 flex justify-between items-center border-b border-[var(--mat-sys-outline-variant)]">
      <a class="flex items-center cursor-pointer logo-container" [href]="homeUrl">
        <div class="logo-word">
          <span class="logo-letter-bold">D</span>
          <span class="logo-letter-fade">elisha</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold">M</span>
          <span class="logo-letter-fade">arie's</span>
        </div>
        <div class="logo-word">
          <span class="logo-letter-bold">K</span>
          <span class="logo-letter-fade">itchen</span>
        </div>
      </a>

      <dml-header-nav [menuLinks]="menuLinks" />
    </mat-toolbar>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly homeUrl = getHomeUrl();

  // Note: Add a `children` array to any item to automatically generate a dropdown!
  protected readonly menuLinks: MenuLink[] = [
    { path: '/recipe-index', label: 'Recipes' },
    { externalUrl: getHomeUrl('/about'), label: 'About' },
    { externalUrl: getHomeUrl('/contact'), label: 'Contact' },
  ];
}
