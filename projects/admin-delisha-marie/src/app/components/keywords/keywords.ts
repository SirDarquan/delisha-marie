import { Component, computed, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-keywords',
  imports: [MatChipsModule],
  template: `
    <div class="flex flex-col gap-3 md:col-span-2">
      <div class="flex justify-between items-center">
        <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Keywords</span>
        <button
          type="button"
          (click)="addKeyword()"
          class="px-4 py-1.5 text-xs font-bold rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1 shadow-sm leading-none">
          <span class="material-icons text-sm">add</span>
          Add Keyword
        </button>
      </div>

      <div
        class="flex flex-wrap gap-2.5 items-center min-h-[46px] p-3 bg-slate-950/40 border border-slate-800 rounded-2xl">
        <mat-chip-set class="flex flex-wrap gap-2 items-center w-full">
          @for (kw of keywords(); track $index; let i = $index) {
            <mat-chip
              class="!bg-purple-500/10 !border !border-purple-500/20 !rounded-xl !h-auto !py-1.5 !px-3">
              <div class="flex items-center gap-1.5">
                <input
                  [id]="'keyword-' + i"
                  type="text"
                  [value]="kw"
                  (input)="onKeywordInput(i, $event)"
                  [size]="kw.length > 8 ? kw.length + 2 : 10"
                  placeholder="Keyword..."
                  class="bg-transparent border-0 p-0 text-xs font-semibold text-white focus:outline-none placeholder-slate-500 transition-all" />
                <button
                  type="button"
                  (click)="removeKeyword(i)"
                  class="text-slate-400 hover:text-rose-400 cursor-pointer flex items-center transition border-0 bg-transparent p-0 leading-none">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </mat-chip>
          }
          @if (!keywords() || keywords().length === 0) {
            <span class="text-slate-500 text-xs italic"
              >No keywords added yet. Click "Add Keyword" to start.</span
            >
          }
        </mat-chip-set>
      </div>
    </div>
  `,
})
export class KeywordsComponent implements FormValueControl<string[]> {
  readonly value = model<string[]>([]);
  readonly keywords = computed(() => this.value());

  addKeyword(): void {
    this.value.update((model) => [...model, '']);
  }

  removeKeyword(idx: number): void {
    this.value.update((model) => model.filter((_, i) => i !== idx));
  }

  onKeywordInput(idx: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.update((model) => {
      const updated = model || [];
      return updated.map((item, i) => (i === idx ? value : item));
    });
  }
}
