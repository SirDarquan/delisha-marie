import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { AuthorBio } from '../author-bio/author-bio';
import { SidebarSearch } from './sidebar-search';
import { Newsletter } from '../newsletter/newsletter';
import { AppConfigService } from '../../services/config.service';

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
  private readonly configService = inject(AppConfigService);

  readonly picture = computed(
    () => this.configService.KitchenHomeConfig()?.sidebar_about ?? 'delisha_marie_profile.png',
  );
}
