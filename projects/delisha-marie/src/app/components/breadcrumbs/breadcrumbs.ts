import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'dml-breadcrumbs',
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="flex flex-wrap" aria-label="Breadcrumb">
      <ol
        class="flex flex-wrap items-center gap-y-2 text-sm font-medium text-[var(--mat-sys-on-surface-variant)]">
        @for (item of items(); track item.label; let last = $last) {
          <li class="flex items-center gap-x-2 whitespace-nowrap">
            @if (item.url && !last) {
              <a
                [routerLink]="item.url"
                class="hover:text-[var(--mat-sys-primary)] transition-colors duration-200">
                {{ item.label }}
              </a>
            } @else {
              <span class="text-[var(--mat-sys-on-surface)] cursor-default">
                {{ item.label }}
              </span>
            }

            @if (!last) {
              <mat-icon class="!text-[16px] !w-4 !h-4 opacity-40 select-none relative top-[0.5px]">
                chevron_right
              </mat-icon>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  /** The list of breadcrumb items to display */
  items = input.required<BreadcrumbItem[]>();
}
