import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';

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
              <mat-option value="custom" class="text-purple-400 font-semibold">
                + Add Custom Diet...
              </mat-option>
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
export class SpecialDietsSelectorComponent {
  private readonly recipeService = inject(RecipeService);

  readonly selectField = viewChild<MatSelect>('select');
  readonly customInputEl = viewChild<ElementRef<HTMLInputElement>>('customInput');

  // Standalone Inputs & Outputs
  initialDiets = input<string[]>([]);
  dietsChange = output<string[]>();

  // Component local states
  selectedDiets = signal<string[]>([]);
  customDietText = signal<string>('');
  localCustomDiets = signal<string[]>([]);

  readonly baselineDiets = computed(() => {
    return this.recipeService.specialDiets().map((d) => d.name);
  });

  // Dynamically compile dietary profiles from database recipes + local additions + initial state
  readonly compiledDiets = computed(() => {
    const recipes = this.recipeService.recipes();
    const dietsSet = new Set<string>();

    // 0. Pre-populate baseline special diets from database
    this.baselineDiets().forEach((d) => {
      if (d?.trim()) {
        dietsSet.add(d.trim());
      }
    });

    // 1. Extract from database recipes
    recipes.forEach((r) => {
      if (r.specialDiets && Array.isArray(r.specialDiets)) {
        r.specialDiets.forEach((d) => {
          if (d?.trim()) {
            dietsSet.add(d.trim());
          }
        });
      }
    });

    // 2. Add local custom additions
    this.localCustomDiets().forEach((d) => {
      if (d?.trim()) {
        dietsSet.add(d.trim());
      }
    });

    // 3. Ensure initial diets are in the set
    const initial = this.initialDiets();
    if (initial && Array.isArray(initial)) {
      initial.forEach((d) => {
        if (d?.trim()) {
          dietsSet.add(d.trim());
        }
      });
    }

    return Array.from(dietsSet).sort((a, b) => a.localeCompare(b));
  });

  constructor() {
    // Sync incoming initial diets when available
    effect(() => {
      const initial = this.initialDiets();
      if (initial && Array.isArray(initial)) {
        this.selectedDiets.set([...initial]);
        // Do not force-hide custom input if user is in the middle of typing
      }
    });
  }

  onSelectionChange(value: string[]): void {
    if (value.includes('custom')) {
      // Intercept the custom click: open custom input, strip 'custom' from value
      this.customDietText.set('');
      const cleaned = value.filter((v) => v !== 'custom');
      this.selectedDiets.set(cleaned);
      this.dietsChange.emit(cleaned);

      // Programmatically close the select overlay panel for clean flow
      if (this.selectField()) {
        this.selectField()!.close();
      }

      // Automatically focus the input field
      setTimeout(() => {
        this.customInputEl()?.nativeElement?.focus();
      }, 50);
    } else {
      this.selectedDiets.set(value);
      this.dietsChange.emit(value);
    }
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

    // Select the new item
    this.selectedDiets.update((selected) => {
      if (!selected.includes(val)) {
        return [...selected, val];
      }
      return selected;
    });

    this.dietsChange.emit(this.selectedDiets());
    this.customDietText.set('');
  }

  cancelCustomDiet(): void {
    this.customDietText.set('');
  }
}
