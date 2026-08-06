import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Recipe, RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'dml-recipe-meta',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div
      class="recipe-meta flex flex-wrap items-center gap-y-4 gap-x-8 py-4 opacity-80 text-sm font-bold tracking-tight">
      <!-- Jump to Recipe -->
      <a
        mat-stroked-button
        routerLink="."
        [routerLink]="[]"
        fragment="recipe-card"
        class="glow-button flex items-center gap-2 transition-all group rounded-full !border-[var(--mat-sys-outline-variant)]">
        <mat-icon class="text-lg w-5 h-5 group-hover:scale-110 transition-transform"
          >restaurant_menu</mat-icon
        >
        <span>Jump to Recipe</span>
      </a>

      <!-- Comment Count -->
      <a
        mat-stroked-button
        [routerLink]="[]"
        fragment="comments"
        class="glow-button flex items-center gap-2 transition-all group rounded-full !border-[var(--mat-sys-outline-variant)]">
        <mat-icon class="text-lg w-5 h-5 group-hover:scale-110 transition-transform"
          >chat_bubble_outline</mat-icon
        >
        <span>{{ commentCount() }} Comment(s)</span>
      </a>

      <!-- Author -->
      <a
        routerLink="/about"
        class="flex items-center gap-2 hover:text-[var(--mat-sys-primary)] transition-colors group no-underline">
        <mat-icon class="text-lg w-5 h-5 group-hover:scale-110 transition-transform"
          >person_outline</mat-icon
        >
        <span
          >Author:
          <span class="text-[var(--mat-sys-primary)]">{{
            recipe().author || 'Delisha Marie'
          }}</span></span
        >
      </a>

      <!-- Published/Updated -->
      <div class="flex items-center gap-2">
        <mat-icon class="text-lg w-5 h-5 opacity-50">calendar_today</mat-icon>
        <span>
          {{ isUpdated() ? 'Updated' : 'Published' }}:
          <time class="text-[var(--mat-sys-primary)]" [attr.datetime]="displayDate()">{{
            displayDate() | date: 'MMM d, yyyy'
          }}</time>
        </span>
      </div>
    </div>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeMeta {
  recipe = input.required<Recipe>();

  private readonly recipeService = inject(RecipeService);

  readonly commentsResource = resource({
    params: () => ({ recipeId: String(this.recipe().id) }),
    loader: ({ params }) => this.recipeService.getComments(params.recipeId),
  });

  commentCountOverride = input<number | null>(null);

  readonly commentCount = computed(() => {
    const override = this.commentCountOverride();
    if (override !== null) return override;
    return this.commentsResource.value()?.total ?? 0;
  });

  readonly isUpdated = computed(() => {
    const r = this.recipe();
    if (!r.updatedAt || !r.createdAt) return false;
    // Consider updated only if there's a difference of more than 1 second (1000ms)
    // between createdAt and updatedAt to account for initial insert triggers.
    const diff = Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime());
    return diff > 1000;
  });

  readonly displayDate = computed(() => {
    const r = this.recipe();
    if (this.isUpdated()) {
      return r.updatedAt;
    }
    return r.createdAt || r.updatedAt || new Date().toISOString();
  });
}
