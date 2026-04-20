import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ingredient } from '../../models/category';

@Component({
  selector: 'dm-recipe-index-ingredients',
  imports: [RouterLink],
  template: `
    <section id="recipe-by-ingredients" class="py-16 bg-[var(--mat-sys-surface)]">
      <div class="into-the-box">
        <header class="mb-10 text-left">
          <h2 class="text-4xl font-extrabold tracking-tight text-[var(--mat-sys-on-surface)]">
            Recipe By <span class="text-[var(--mat-sys-primary)]">Ingredients</span>
          </h2>
          <div class="h-1 w-16 bg-[var(--mat-sys-primary)] mt-4 rounded-full"></div>
        </header>

        <!-- Alphabetical Jump Links -->
        <nav class="flex flex-wrap gap-2 mb-12 py-4 justify-center">
          @for (group of groupedIngredients(); track group.letter) {
            <a
              [href]="'/recipe-index#' + group.letter"
              class="w-12 h-10 flex items-center justify-center rounded-lg bg-[var(--mat-sys-surface-container-highest)] text-[var(--mat-sys-primary)] font-bold hover:bg-[var(--mat-sys-primary)] hover:text-[var(--mat-sys-on-primary)] transition-all duration-200 no-underline shadow-sm">
              {{ group.letter }}
            </a>
          }
        </nav>

        <!-- Ingredient Groups -->
        <div class="space-y-8">
          @for (group of groupedIngredients(); track group.letter) {
            <div [id]="group.letter" class="scroll-mt-24">
              <header class="flex justify-between items-baseline mb-6">
                <h3 class="text-5xl font-black text-[var(--mat-sys-outline)] opacity-50">
                  {{ group.letter }}
                </h3>
                <a
                  href="/recipe-index#recipe-by-ingredients"
                  class="text-sm font-bold text-[var(--mat-sys-secondary)] hover:text-[var(--mat-sys-primary)] flex items-center gap-1 no-underline uppercase tracking-wider">
                  <span class="material-icons text-base">expand_less</span>
                  (back to top)
                </a>
              </header>

              <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-12">
                @for (item of group.items; track item.name) {
                  <div class="flex flex-col break-inside-avoid mb-4 group/item">
                    <div class="flex items-baseline gap-2">
                      <a
                        [routerLink]="item.url"
                        class="text-[var(--mat-sys-on-surface)] font-bold hover:text-[var(--mat-sys-primary)] transition-colors text-lg flex items-baseline gap-1">
                        {{ item.name }}
                        <span class="text-sm font-medium text-[var(--mat-sys-outline)]"
                          >({{ getItemCount(item) }})</span
                        >
                      </a>
                    </div>

                    @if (item.children && item.children.length > 0) {
                      <ul class="list-none p-0 m-0 space-y-2 mt-2">
                        @for (child of item.children; track child.name) {
                          <li class="pl-6 relative">
                            <div class="flex items-baseline gap-2">
                              <a
                                [routerLink]="child.url"
                                class="text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] transition-colors text-base font-medium flex items-baseline gap-1">
                                {{ child.name }}
                                <span class="text-xs font-normal text-[var(--mat-sys-outline)]"
                                  >({{ child.count || 0 }})</span
                                >
                              </a>
                            </div>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      html {
        scroll-behavior: smooth;
      }
      .scroll-mt-24 {
        scroll-margin-top: 6rem;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIndexIngredients {
  readonly ingredients = input.required<Ingredient[]>();

  readonly groupedIngredients = computed(() => {
    const sorted = [...this.ingredients()].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, Ingredient[]> = {};

    sorted.forEach((item) => {
      const letter = item.name.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((letter) => ({
        letter,
        items: groups[letter],
      }));
  });

  getItemCount(item: Ingredient): number {
    if (item.children && item.children.length > 0) {
      return item.children.reduce((sum, child) => sum + (child.count || 0), 0);
    }
    return item.count || 0;
  }
}
