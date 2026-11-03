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
  selector: 'app-holidays-selector',
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- 1. The Material Single-Select Dropdown -->
        <div class="relative flex-1">
          <mat-form-field appearance="outline" class="custom-mat-form-field">
            <mat-label>Holidays</mat-label>
            <mat-select
              #select
              id="holidays-select"
              [value]="selectedHoliday()"
              (selectionChange)="onHolidaySelect($event.value)"
              panelClass="custom-select-panel"
              placeholder="Select Holiday">
              <mat-option class="text-slate-400">Select Holiday</mat-option>
              @for (holiday of compiledHolidays(); track holiday) {
                <mat-option [value]="holiday">{{ holiday }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- 2. Custom Holiday text input (if clicked Add Custom) -->
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
            matButton="tonal"
            (click)="addCustomHoliday()"
            [disabled]="!customHolidayText().trim()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center justify-center shrink-0">
            Add
          </button>
          <button
            type="button"
            matButton
            (click)="cancelCustomHoliday()"
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
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HolidaysSelectorComponent implements FormValueControl<string> {
  private readonly recipeService = inject(RecipeService);

  // Standalone Inputs & Outputs
  holidayChange = output<string>();

  // Component local states
  readonly value = model<string>('');
  readonly selectedHoliday = computed(() => this.value());
  customHolidayText = signal<string>('');
  localCustomHolidays = signal<string[]>([]);

  readonly baselineHolidays = computed(() => {
    return this.recipeService.holidays().map((h) => h.name);
  });

  // Dynamically compile holidays/occasions from database recipes + local additions + initial state
  readonly compiledHolidays = computed(() => {
    const holidaysSet = new Set<string>();

    // 0. Pre-populate baseline holidays from database
    this.baselineHolidays().forEach((h) => {
      if (h?.trim()) {
        holidaysSet.add(h.trim());
      }
    });

    // 1. Add local custom holidays
    this.localCustomHolidays().forEach((h) => {
      if (h?.trim()) {
        holidaysSet.add(h.trim());
      }
    });

    // 2. Add current value if not already present
    const currentVal = this.value();
    if (currentVal?.trim()) {
      holidaysSet.add(currentVal.trim());
    }

    return Array.from(holidaysSet).sort((a, b) => a.localeCompare(b));
  });

  onHolidaySelect(value: string): void {
    this.value.set(value);
    this.holidayChange.emit(value);
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

    this.customHolidayText.set('');

    setTimeout(() => {
      this.value.set(val);
      this.holidayChange.emit(val);
    }, 0);
  }

  cancelCustomHoliday(): void {
    this.customHolidayText.set('');
  }
}
