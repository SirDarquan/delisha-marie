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
      @for (tag of allTags(); track tag.url) {
        <a
          matButton="outlined"
          [routerLink]="tag.url"
          class="tag-link text-sm font-bold tracking-tight text-[var(--mat-sys-on-surface-variant)] hover:text-[var(--mat-sys-primary)] hover:bg-[var(--mat-sys-primary-container)] hover:border-[var(--mat-sys-primary)] transition-all no-underline px-5 py-2.5 bg-[var(--mat-sys-surface-container-high)] rounded-full border border-[var(--mat-sys-outline-variant)] hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center">
          {{ tag.label }}
        </a>
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

  readonly allTags = computed(() => {
    const r = this.recipe();
    const groups = r.breadcrumbs?.items || [];

    const tags: { label: string; url: string }[] = [];
    const seen = new Set<string>();

    const addTag = (label: string, url: string) => {
      if (!seen.has(label)) {
        seen.add(label);
        tags.push({ label, url });
      }
    };

    // 1. Add categories from breadcrumbs
    groups.forEach((trail) => {
      trail.forEach((item) => {
        if (item.label !== 'Home' && item.label !== r.title && item.url) {
          addTag(item.label, item.url);
        }
      });
    });

    const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

    // 2. Add Method
    if (r.method) {
      addTag(r.method, `/methods/${slugify(r.method)}`);
    }

    // 3. Add Holidays
    if (r.holidays && Array.isArray(r.holidays)) {
      r.holidays.forEach((h) => {
        if (h) addTag(h, `/holidays/${slugify(h)}`);
      });
    }

    // 4. Add Special Diets
    if (r.specialDiets && Array.isArray(r.specialDiets)) {
      r.specialDiets.forEach((d) => {
        if (d) addTag(d, `/special-diets/${slugify(d)}`);
      });
    }

    return tags;
  });
}
