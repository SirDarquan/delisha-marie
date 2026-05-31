import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  ViewEncapsulation,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-holidays-selector',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="flex flex-col gap-2">
      <label class="text-xs font-semibold text-slate-300">
        Holidays & Occasions
      </label>
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- 1. The Material Single-Select Dropdown -->
        <div class="relative flex-1">
          <mat-form-field appearance="outline" class="custom-mat-form-field">
            <mat-select
              #select
              id="holidays-select"
              [value]="selectedHoliday()"
              (selectionChange)="onHolidaySelect($event.value)"
              panelClass="custom-select-panel"
              placeholder="Select Holiday/Occasion">
              <mat-option value="" class="text-slate-400">Select Holiday/Occasion</mat-option>
              @for (holiday of compiledHolidays(); track holiday) {
                <mat-option [value]="holiday">{{ holiday }}</mat-option>
              }
              <mat-option value="custom" class="text-purple-400 font-semibold">
                + Add Custom Holiday...
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- 2. Custom Holiday text input (if clicked Add Custom) -->
        @if (showCustomInput()) {
          <div class="flex gap-2 items-center flex-1 animate-fadeIn">
            <input
              #customInput
              type="text"
              [value]="customHolidayText()"
              (input)="onCustomTextChange($event)"
              (keydown.enter)="addCustomHoliday()"
              placeholder="e.g., Thanksgiving, Christmas"
              class="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            <button
              type="button"
              (click)="addCustomHoliday()"
              [disabled]="!customHolidayText().trim()"
              class="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center justify-center shrink-0">
              Add
            </button>
            <button
              type="button"
              (click)="cancelCustomHoliday()"
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
      .custom-select-panel .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled) .mdc-list-item__primary-text {
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
export class HolidaysSelectorComponent {
  private readonly recipeService = inject(RecipeService);

  readonly selectField = viewChild<MatSelect>('select');
  readonly customInputEl = viewChild<ElementRef<HTMLInputElement>>('customInput');

  // Standalone Inputs & Outputs
  initialHoliday = input<string>('');
  holidayChange = output<string>();

  // Component local states
  selectedHoliday = signal<string>('');
  customHolidayText = signal<string>('');
  showCustomInput = signal<boolean>(false);
  localCustomHolidays = signal<string[]>([]);

  // Dynamically compile holidays/occasions from database recipes + local additions + initial state
  readonly compiledHolidays = computed(() => {
    const recipes = this.recipeService.recipes();
    const holidaysSet = new Set<string>();

    // 1. Extract from database recipes
    recipes.forEach((r) => {
      if (r.holidays && Array.isArray(r.holidays)) {
        r.holidays.forEach((h) => {
          if (h && h.trim()) {
            holidaysSet.add(h.trim());
          }
        });
      }
    });

    // 2. Add local custom additions
    this.localCustomHolidays().forEach((h) => {
      if (h && h.trim()) {
        holidaysSet.add(h.trim());
      }
    });

    // 3. Ensure initial incoming holiday is in the set
    const initial = this.initialHoliday();
    if (initial && initial.trim()) {
      holidaysSet.add(initial.trim());
    }

    return Array.from(holidaysSet).sort((a, b) => a.localeCompare(b));
  });

  constructor() {
    // Sync incoming initial holiday when available
    effect(() => {
      const initial = this.initialHoliday();
      this.selectedHoliday.set(initial || '');
      this.showCustomInput.set(false);
    });
  }

  onHolidaySelect(value: string): void {
    if (value === 'custom') {
      // Intercept custom: open custom input, close panel, focus
      this.showCustomInput.set(true);
      this.customHolidayText.set('');

      if (this.selectField()) {
        this.selectField()!.close();
      }

      setTimeout(() => {
        this.customInputEl()?.nativeElement?.focus();
      }, 50);
    } else {
      this.showCustomInput.set(false);
      this.selectedHoliday.set(value);
      this.holidayChange.emit(value);
    }
  }

  onCustomTextChange(event: Event): void {
    this.customHolidayText.set((event.target as HTMLInputElement).value);
  }

  addCustomHoliday(): void {
    const val = this.customHolidayText().trim();
    if (!val) return;

    // Add to session custom list
    this.localCustomHolidays.update((list) => {
      if (!list.includes(val)) {
        return [...list, val];
      }
      return list;
    });

    this.selectedHoliday.set(val);
    this.showCustomInput.set(false);
    this.holidayChange.emit(val);
    this.customHolidayText.set('');
  }

  cancelCustomHoliday(): void {
    this.showCustomInput.set(false);
    this.customHolidayText.set('');
    // Revert to original selected
    this.holidayChange.emit(this.selectedHoliday());
  }
}
