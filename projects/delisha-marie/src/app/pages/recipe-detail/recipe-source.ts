import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Recipe } from '../../services/recipe.service';

@Component({
  selector: 'dml-recipe-source',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (sanitizedSource()) {
      <div
        class="recipe-source-container mt-12 mb-4 px-4 sm:px-0 text-[var(--mat-sys-on-surface-variant)] text-sm font-medium italic opacity-80">
        <span
          class="font-black uppercase tracking-widest mr-2 text-[var(--mat-sys-primary)] not-italic">
          Recipe Source:
        </span>
        <span class="source-content" [innerHTML]="sanitizedSource()"></span>
      </div>
    }
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeSource {
  recipe = input.required<Recipe>();
  private readonly sanitizer = inject(DomSanitizer);

  readonly sanitizedSource = computed(() => {
    const src = this.recipe().source;
    if (!src) return null;

    // Add target="_blank" and rel="noopener noreferrer" to all anchor tags
    // This matches standard HTML anchors as well as potentially markdown if already parsed.
    // The user mentioned it could have links, so we make sure they open in a new window.
    const modified = src.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
      // Avoid duplicating target or rel if they already exist, though regex replacement
      // of existing ones can be complex, we just forcefully add them at the start of attrs.
      // A cleaner way is to just inject them.
      return `<a target="_blank" rel="noopener noreferrer" ${attrs}>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(modified);
  });
}
