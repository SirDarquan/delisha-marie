import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HeaderLogo, HeaderNav, MenuLink } from '@dm/library';
import { getHomeUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-header',
  imports: [MatToolbarModule, HeaderLogo, HeaderNav],
  host: {
    class: 'sticky top-0 z-50 block',
  },
  template: `
    <mat-toolbar
      class="!bg-[var(--mat-sys-surface)]/80 backdrop-blur-md h-20 px-4 md:px-8 flex justify-between items-center border-b border-[var(--mat-sys-outline-variant)]">
      <dml-header-logo [words]="logoWords" [href]="homeUrl" />

      <dml-header-nav [menuLinks]="menuLinks" />
    </mat-toolbar>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly homeUrl = getHomeUrl();
  protected readonly logoWords = ['Delisha', "Marie's", 'Kitchen'];

  // Note: Add a `children` array to any item to automatically generate a dropdown!
  protected readonly menuLinks: MenuLink[] = [
    { path: '/recipe-index', label: 'Recipes' },
    { externalUrl: getHomeUrl('/about'), label: 'About' },
    { externalUrl: getHomeUrl('/contact'), label: 'Contact' },
  ];
}
