import { ChangeDetectionStrategy, Component, computed, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-search-ingredients',
  imports: [MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3 md:col-span-2">
      <div class="flex flex-wrap justify-between items-center gap-2">
        <div>
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Ingredients for Search (Tags)
          </span>
          <p class="text-slate-400 text-[11px] mt-0.5">
            These tags index this recipe in the Recipe By Ingredients search once published.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="autoDetect.emit()"
            aria-label="Auto-detect search ingredients from text"
            class="px-3 py-1.5 text-xs font-bold rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 transition cursor-pointer flex items-center gap-1 shadow-sm leading-none">
            <span class="material-icons text-sm">auto_awesome</span>
            Auto-Detect
          </button>
          <button
            type="button"
            (click)="addIngredient()"
            aria-label="Add custom search ingredient tag"
            class="px-3 py-1.5 text-xs font-bold rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1 shadow-sm leading-none">
            <span class="material-icons text-sm">add</span>
            Add Ingredient
          </button>
        </div>
      </div>

      <div
        class="flex flex-wrap gap-2.5 items-center min-h-[46px] p-3 bg-slate-950/40 border border-slate-800 rounded-2xl">
        <mat-chip-set class="flex flex-wrap gap-2 items-center w-full">
          @for (ing of searchIngredients(); track $index; let i = $index) {
            <mat-chip
              class="!bg-pink-500/10 !border !border-pink-500/20 !rounded-xl !h-auto !py-1.5 !px-3">
              <div class="flex items-center gap-1.5">
                <input
                  [id]="'search-ingredient-' + i"
                  type="text"
                  [value]="ing"
                  (input)="onIngredientInput(i, $event)"
                  [size]="ing.length > 8 ? ing.length + 2 : 10"
                  placeholder="Ingredient..."
                  class="bg-transparent border-0 p-0 text-xs font-semibold text-white focus:outline-none placeholder-slate-500 transition-all" />
                <button
                  type="button"
                  (click)="removeIngredient(i)"
                  [attr.aria-label]="'Remove ' + (ing || 'ingredient')"
                  class="text-slate-400 hover:text-rose-400 cursor-pointer flex items-center transition border-0 bg-transparent p-0 leading-none">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </mat-chip>
          }
          @if (!searchIngredients() || searchIngredients().length === 0) {
            <span class="text-slate-500 text-xs italic">
              No search ingredients added. Click "Auto-Detect" to parse from text, or "Add
              Ingredient" to add manually.
            </span>
          }
        </mat-chip-set>
      </div>
    </div>
  `,
})
export class SearchIngredientsComponent implements FormValueControl<string[]> {
  readonly value = model<string[]>([]);
  readonly searchIngredients = computed(() => this.value() || []);

  /**
   * Signal-based output emitted when the food creator clicks "Auto-Detect".
   */
  readonly autoDetect = output<void>();

  addIngredient(initialValue = ''): void {
    this.value.update((model) => [...(model || []), initialValue]);
  }

  removeIngredient(idx: number): void {
    this.value.update((model) => (model || []).filter((_, i) => i !== idx));
  }

  onIngredientInput(idx: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.value.update((model) => {
      const updated = model || [];
      return updated.map((item, i) => (i === idx ? val : item));
    });
  }
}
