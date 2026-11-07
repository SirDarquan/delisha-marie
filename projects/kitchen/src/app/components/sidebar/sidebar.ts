import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { AuthorBio } from '../author-bio/author-bio';
import { SidebarSearch } from './sidebar-search';
import { Newsletter } from '../newsletter/newsletter';

@Component({
  selector: 'dml-sidebar',
  imports: [AuthorBio, SidebarSearch, Newsletter],
  template: `
    <div class="flex flex-col gap-8 h-full">
      <dm-author-bio [picture]="picture()" />
      <dm-sidebar-search />
      <dm-newsletter layout="box" />
      <ng-content />
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly picture = signal<string>('/delisha_marie_profile.png');
}
