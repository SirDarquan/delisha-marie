import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

export interface RefineByItem {
  name: string;
  url: string;
}

@Component({
  selector: 'dml-refine-by',
  imports: [RouterLink, MatButtonModule],
  template: `
    @if (items().length > 0) {
      <div class="flex flex-wrap items-center gap-4 py-2">
        <span
          class="text-xs font-black uppercase tracking-[0.2em] text-[var(--mat-sys-outline)] select-none">
          Refine
        </span>
        <div class="flex flex-wrap items-center gap-2">
          @for (item of items(); track item.name) {
            <a
              matButton="outlined"
              [routerLink]="item.url"
              class="inline-flex items-center px-4 py-1.5 bg-[var(--mat-sys-surface-container-high)] hover:bg-[var(--mat-sys-primary-container)] rounded-full transition-all no-underline border border-[var(--mat-sys-outline-variant)] shadow-sm hover:shadow-md">
              <span class="font-bold text-xs text-[var(--mat-sys-on-surface)]">
                {{ item.name }}
              </span>
            </a>
          }
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefineBy {
  items = input.required<RefineByItem[]>();
}
