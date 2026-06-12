import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../services/recipe.service';

@Component({
  selector: 'dml-recipe-tags',
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <div class="recipe-tags-container mt-16 mb-12 flex flex-wrap justify-center gap-4 px-4 sm:px-0">
      @for (group of tagGroups(); track $index) {
        @for (item of group.items; track item.url) {
          <a
            matButton="outlined"
            [routerLink]="item.url"
            class="tag-link text-sm font-bold tracking-tight text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] hover:bg-[var(--mat-sys-primary-container)] hover:border-[var(--mat-sys-primary)] transition-all no-underline px-5 py-2.5 bg-[var(--mat-sys-surface-container-high)] rounded-full border border-[var(--mat-sys-outline-variant)] hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center">
            {{ item.label }}
          </a>
        }
      }
    </div>
  `,
  styles: `
    .tag-link {
      text-decoration: none;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeTags {
  recipe = input.required<Recipe>();

  readonly tagGroups = computed(() => {
    const r = this.recipe();
    const groups = r.breadcrumbs.items || [];
    // Filter out "Home" and the Recipe itself from each group
    return groups
      .map((trail) => ({
        items: trail.filter((item) => item.label !== 'Home' && item.label !== r.title),
      }))
      .filter((group) => group.items.length > 0);
  });
}
