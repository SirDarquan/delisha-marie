import { CommonModule } from '@angular/common';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-special-diets-selector',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-slate-300"> Special Dietary Profile </span>
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- 1. The Material Multi-Select Dropdown -->
        <div class="relative flex-1">
          <mat-form-field appearance="outline" class="custom-mat-form-field">
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
        @if (showCustomInput()) {
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
              type="button"
              (click)="addCustomDiet()"
              [disabled]="!customDietText().trim()"
              class="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center justify-center shrink-0">
              Add
            </button>
            <button
              type="button"
              (click)="cancelCustomDiet()"
              class="px-3 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer border-0 bg-transparent">
              Cancel
            </button>
          </div>
        }
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

      /* Form field custom container overrides */
      .custom-mat-form-field {
        width: 100%;
        --mdc-outlined-text-field-container-shape: 12px;
        --mdc-outlined-text-field-outline-color: rgba(71, 85, 105, 0.6);
        --mdc-outlined-text-field-focus-outline-color: #c084fc;
        --mdc-outlined-text-field-container-color: rgba(30, 41, 59, 0.4);
        --mdc-outlined-text-field-container-height: 44px;
        --mat-select-trigger-text-color: #ffffff;
        --mat-select-placeholder-text-color: #94a3b8;
      }
      .custom-mat-form-field .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
      .custom-mat-form-field .mat-mdc-form-field-flex {
        height: 44px !important;
        align-items: center !important;
      }
      .custom-mat-form-field .mat-mdc-select-value {
        color: #ffffff !important;
        font-size: 14px !important;
      }
      .custom-mat-form-field .mat-mdc-select-placeholder {
        color: #94a3b8 !important;
        font-size: 14px !important;
      }
      .custom-mat-form-field .mat-mdc-select-arrow {
        color: #94a3b8 !important;
      }
      .custom-select-panel {
        background-color: #0f172a !important; /* slate-900 */
        border: 1px solid rgba(71, 85, 105, 0.6) !important;
        border-radius: 12px !important;
        margin-top: 4px !important;
      }
      .custom-select-panel .mat-mdc-option {
        color: #e2e8f0 !important; /* slate-200 */
        font-size: 14px !important;
      }
      .custom-select-panel
        .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled)
        .mdc-list-item__primary-text {
        color: #c084fc !important; /* purple-400 */
      }
      .custom-select-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) {
        background-color: rgba(168, 85, 247, 0.1) !important; /* purple-500/10 */
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
  showCustomInput = signal<boolean>(false);
  localCustomDiets = signal<string[]>([]);

  // Dynamically compile dietary profiles from database recipes + local additions + initial state
  readonly compiledDiets = computed(() => {
    const recipes = this.recipeService.recipes();
    const dietsSet = new Set<string>();

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
      this.showCustomInput.set(true);
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

    this.showCustomInput.set(false);
    this.dietsChange.emit(this.selectedDiets());
    this.customDietText.set('');
  }

  cancelCustomDiet(): void {
    this.showCustomInput.set(false);
    this.customDietText.set('');
  }
}
