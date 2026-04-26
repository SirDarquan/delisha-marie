import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorBio } from './author-bio';
import { SidebarSearch } from './sidebar-search';
import { SidebarNewsletter } from './sidebar-newsletter';

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
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {}
