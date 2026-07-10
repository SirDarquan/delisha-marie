import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../models/category';

@Component({
  selector: 'dm-recipe-index-link-list',
  imports: [RouterLink],
  template: `
    @if (sortedItems().length > 0) {
      <section class="py-16 bg-[var(--mat-sys-surface)]" [attr.aria-labelledby]="titleId()">
        <div class="into-the-box">
          <header class="mb-10 text-left">
            <h2
              [id]="titleId()"
              class="text-4xl font-extrabold tracking-tight text-[var(--mat-sys-on-surface)]">
              {{ titlePrefix() }}
              <span class="text-[var(--mat-sys-primary)]">{{ titleHighlight() }}</span>
            </h2>
            <div class="h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full"></div>
          </header>

          <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-12">
            @for (item of sortedItems(); track item.name) {
              <div class="flex flex-col break-inside-avoid mb-2">
                <a
                  [routerLink]="item.url"
                  class="text-[var(--mat-sys-primary)] font-black hover:underline transition-all duration-200 text-xl mb-2 block">
                  {{ item.name }}
                </a>
                @if (item.children && item.children.length > 0) {
                  <ul class="list-none p-0 m-0 space-y-2 mb-2">
                    @for (child of item.children; track child.name) {
                      <li>
                        <a
                          [routerLink]="child.url"
                          class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] transition-colors text-base font-medium pl-6 block">
                          {{ child.name }}
                        </a>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        </div>
      </section>
    }
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
export class RecipeIndexLinkList {
  readonly items = input.required<Category[]>();
  readonly titlePrefix = input.required<string>();
  readonly titleHighlight = input.required<string>();
  readonly titleId = input.required<string>();

  readonly sortedItems = computed(() => {
    return [...this.items()].sort((a, b) => a.name.localeCompare(b.name));
  });
}
