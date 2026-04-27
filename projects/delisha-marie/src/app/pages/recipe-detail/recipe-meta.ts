import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  input,
  inject,
  computed,
  resource,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
          {{ recipe().updatedAt ? 'Updated' : 'Published' }}:
          <time class="text-[var(--mat-sys-primary)]" [attr.datetime]="date()">{{
            date() | date: 'MMM d, yyyy'
          }}</time>
        </span>
      </div>
    </div>
  `,
  styles: `
    .recipe-meta a.no-underline {
      text-decoration: none;
      color: inherit;
    }
    .glow-button:hover {
      background-color: var(--mat-sys-primary-container) !important;
      color: var(--mat-sys-on-primary-container) !important;
      box-shadow: 0 0 15px rgba(var(--mat-sys-primary-rgb), 0.4);
      border-color: var(--mat-sys-primary) !important;
    }
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

  readonly commentCount = computed(() => this.commentsResource.value()?.length ?? 0);

  readonly date = computed(
    () => this.recipe().updatedAt || this.recipe().createdAt || new Date().toISOString(),
  );
}
