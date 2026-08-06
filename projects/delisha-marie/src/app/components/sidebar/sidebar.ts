import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { AuthorBio } from './author-bio';
import { SidebarNewsletter } from './sidebar-newsletter';
import { SidebarSearch } from './sidebar-search';

@Component({
  selector: 'dml-sidebar',
  imports: [CommonModule, AuthorBio, SidebarSearch, SidebarNewsletter],
  template: `
    <div class="flex flex-col gap-8 h-full">
      <dm-author-bio />
      <dm-sidebar-search />
      <dm-sidebar-newsletter />
      <ng-content />
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
