import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-cooking-method-selector',
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- 1. The Material Select Dropdown -->
        <div class="relative flex-1">
          <mat-form-field appearance="outline" class="custom-mat-form-field">
            <mat-label>Cooking Methods</mat-label>
            <mat-select
              id="cooking-method-select"
              [value]="selectedMethod()"
              [required]="required()"
              (selectionChange)="onMethodSelect($event.value)"
              panelClass="custom-select-panel"
              placeholder="Select Cooking Method">
              @for (method of compiledMethods(); track method) {
                <mat-option [value]="method">{{ method }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- 2. Custom Method text input (if selected) -->
        <div class="flex gap-2 items-center flex-1 animate-fadeIn">
          <input
            #customInput
            type="text"
            [value]="customMethodText()"
            (input)="onCustomTextChange($event)"
            (keydown.enter)="addCustomMethod()"
            placeholder="e.g., Smoking, Dehydrating"
            class="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
          <button
            matButton="tonal"
            type="button"
            (click)="addCustomMethod()"
            [disabled]="!customMethodText().trim()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center justify-center shrink-0">
            Add
          </button>
          <button
            matButton
            type="button"
            (click)="cancelCustomMethod()"
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
      .custom-mat-form-field .mat-mdc-floating-label {
        top: 22px !important;
      }
      .custom-mat-form-field .mat-mdc-floating-label.mdc-floating-label--float-above {
        top: 28px !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookingMethodSelectorComponent implements FormValueControl<string> {
  private readonly recipeService = inject(RecipeService);

  // Standalone value model for signals form integration
  readonly value = model<string>('');
  readonly required = input<boolean>(false);

  // Backward compatible inputs/outputs for specs and legacy usage
  methodChange = output<string>();

  // Computed property to sync/keep selectedMethod readable
  readonly selectedMethod = computed(() => this.value());

  customMethodText = signal<string>('');
  localCustomMethods = signal<string[]>([]);

  readonly baselineMethods = computed(() => {
    return this.recipeService.methods().map((m) => m.name);
  });

  // Dynamically compile methods from current database recipes + local additions
  readonly compiledMethods = computed(() => {
    const methodsSet = new Set<string>();

    // 1. Pre-populate baseline methods
    this.baselineMethods().forEach((m) => {
      if (m?.trim()) {
        methodsSet.add(m.trim());
      }
    });

    // 2. Add current value if not already present
    const currentVal = this.value();
    if (currentVal && currentVal.trim()) {
      methodsSet.add(currentVal.trim());
    }

    return Array.from(methodsSet).sort((a, b) => a.localeCompare(b));
  });

  onMethodSelect(val: string): void {
    this.value.set(val);
    this.methodChange.emit(val);
  }

  onCustomTextChange(event: Event): void {
    this.customMethodText.set((event.target as HTMLInputElement).value);
  }

  addCustomMethod(): void {
    const val = this.customMethodText().trim();
    if (!val) return;

    this.customMethodText.set('');

    setTimeout(() => {
      this.value.set(val);
      this.methodChange.emit(val);
    }, 0);
  }

  cancelCustomMethod(): void {
    this.customMethodText.set('');
  }
}
