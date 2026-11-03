import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-special-diets-selector',
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- 1. The Material Multi-Select Dropdown -->
        <div class="relative flex-1">
          <mat-form-field appearance="outline" class="custom-mat-form-field">
            <mat-label>Special Diets</mat-label>
            <mat-select
              #select
              id="special-diets-select"
              [value]="selectedDiets()"
              [multiple]="true"
              (selectionChange)="onSelectionChange($event.value)"
              panelClass="custom-select-panel"
              placeholder="Select Dietary Profile">
              @for (diet of compiledDiets(); track diet) {
                <mat-option [value]="diet">{{ diet }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- 2. Custom Diet text input (if clicked Add Custom) -->
        <div class="flex gap-2 items-center flex-1 animate-fadeIn">
          <input
            #customInput
            type="text"
            [value]="customDietText()"
            (input)="onCustomTextChange($event)"
            (keydown.enter)="addCustomDiet()"
            placeholder="e.g., Keto, Nut Free"
            class="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
          <button
            matButton="tonal"
            type="button"
            (click)="addCustomDiet()"
            [disabled]="!customDietText().trim()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center justify-center shrink-0">
            Add
          </button>
          <button
            type="button"
            matButton
            (click)="cancelCustomDiet()"
            class="px-3 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer border-0 bg-transparent">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
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
export class SpecialDietsSelectorComponent implements FormValueControl<string[]> {
  private readonly recipeService = inject(RecipeService);

  // Standalone Inputs & Outputs
  readonly value = model<string[]>([]);
  dietsChange = output<string[]>();

  // Component local states
  readonly selectedDiets = computed(() => this.value());
  customDietText = signal<string>('');
  localCustomDiets = signal<string[]>([]);

  readonly baselineDiets = computed(() => {
    return this.recipeService.specialDiets().map((d) => d.name);
  });

  // Dynamically compile dietary profiles from database recipes + local additions + initial state
  readonly compiledDiets = computed(() => {
    const dietsSet = new Set<string>();

    // 0. Pre-populate baseline special diets from database
    this.baselineDiets().forEach((d) => {
      if (d?.trim()) {
        dietsSet.add(d.trim());
      }
    });

    // 1. Add local custom diets
    this.localCustomDiets().forEach((d) => {
      if (d?.trim()) {
        dietsSet.add(d.trim());
      }
    });

    // 2. Add currently selected diets if not already present
    this.value().forEach((d) => {
      if (d?.trim()) {
        dietsSet.add(d.trim());
      }
    });

    return Array.from(dietsSet).sort((a, b) => a.localeCompare(b));
  });

  onSelectionChange(value: string[]): void {
    this.value.set(value);
    this.dietsChange.emit(value);
  }

  onCustomTextChange(event: Event): void {
    this.customDietText.set((event.target as HTMLInputElement).value);
  }

  addCustomDiet(): void {
    const val = this.customDietText().trim();
    if (!val) return;

    // Add to session custom list
    this.localCustomDiets.update((list) => {
      if (!list.includes(val)) {
        return [...list, val];
      }
      return list;
    });

    this.customDietText.set('');

    setTimeout(() => {
      // Select the new item
      this.value.update((selected) => {
        if (!selected.includes(val)) {
          return [...selected, val];
        }
        return selected;
      });

      this.dietsChange.emit(this.value());
    }, 0);
  }

  cancelCustomDiet(): void {
    this.customDietText.set('');
  }
}
