import {
  Component,
  input,
  ChangeDetectionStrategy,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface NavRecipe {
  title: string;
  slug: string;
}

@Component({
  selector: 'dml-recipe-navigation',
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    @if (shouldShow()) {
      <div class="recipe-navigation my-12 border-y border-[var(--mat-sys-outline-variant)] py-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <!-- Previous Link -->
          <div class="prev-container">
            @if (previous(); as prev) {
              <a [routerLink]="prev.slug" class="group block no-underline">
                <div
                  class="flex items-center gap-2 mb-2 opacity-40 group-hover:opacity-100 group-hover:text-[var(--mat-sys-primary)] transition-all">
                  <mat-icon class="text-xl">arrow_back</mat-icon>
                  <span class="text-[10px] font-black uppercase tracking-widest"
                    >Previous Recipe</span
                  >
                </div>
                <h4
                  class="text-2xl md:text-3xl font-black group-hover:text-[var(--mat-sys-primary)] transition-colors leading-tight tracking-tight pl-7">
                  {{ prev.title }}
                </h4>
              </a>
            }
          </div>

          <!-- Next Link -->
          <div class="next-container text-right">
            @if (next(); as n) {
              <a [routerLink]="n.slug" class="group block no-underline">
                <div
                  class="flex flex-row-reverse items-center gap-2 mb-2 opacity-40 group-hover:opacity-100 group-hover:text-[var(--mat-sys-primary)] transition-all">
                  <mat-icon class="text-xl">arrow_forward</mat-icon>
                  <span class="text-[10px] font-black uppercase tracking-widest">Next Recipe</span>
                </div>
                <h4
                  class="text-2xl md:text-3xl font-black group-hover:text-[var(--mat-sys-primary)] transition-colors leading-tight tracking-tight pr-7">
                  {{ n.title }}
                </h4>
              </a>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .recipe-navigation {
        animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeNavigation {
  previous = input<NavRecipe | null>(null);
  next = input<NavRecipe | null>(null);

  // Requirement:
  // If this is the first recipe (index 0), nothing shows.
  // If it's the second recipe (index 1) or more, show navigation.
  shouldShow = computed(() => {
    return this.previous() || this.next();
  });
}
