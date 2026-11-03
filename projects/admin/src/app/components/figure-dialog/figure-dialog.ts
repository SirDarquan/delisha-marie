import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface FigureDialogData {
  outerFigureClass?: string;
  innerFigureClass?: string;
  imgClass?: string;
  captionText?: string;
  captionClass?: string;
}

@Component({
  selector: 'app-figure-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div
      class="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 max-w-md w-full shadow-2xl backdrop-blur-md">
      <h2
        mat-dialog-title
        class="text-lg font-bold text-white mb-3 p-0 border-0 flex items-center gap-2 select-none">
        <span class="material-icons text-purple-400 !text-[22px]" aria-hidden="true"
          >subtitles</span
        >
        Configure Figure & Caption
      </h2>

      <!-- Quick Layout Presets -->
      <div class="mb-3 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
        <span
          class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
          Layout Presets
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="applyPreset('gallery-2')"
            [class.bg-purple-600]="currentColumn() === 'column-2'"
            [class.text-white]="currentColumn() === 'column-2'"
            [class.bg-purple-500/20]="currentColumn() !== 'column-2'"
            [class.text-purple-300]="currentColumn() !== 'column-2'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-500/40 transition cursor-pointer">
            Gallery 2 Column
          </button>

          <button
            type="button"
            (click)="applyPreset('gallery-3')"
            [class.bg-purple-600]="currentColumn() === 'column-3'"
            [class.text-white]="currentColumn() === 'column-3'"
            [class.bg-purple-500/20]="currentColumn() !== 'column-3'"
            [class.text-purple-300]="currentColumn() !== 'column-3'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-500/40 transition cursor-pointer">
            Gallery 3 Column
          </button>

          <button
            type="button"
            (click)="applyPreset('single-step')"
            [class.bg-purple-600]="currentColumn() === 'none'"
            [class.text-white]="currentColumn() === 'none'"
            [class.bg-slate-700/60]="currentColumn() !== 'none'"
            [class.text-slate-300]="currentColumn() !== 'none'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600/40 transition cursor-pointer">
            Single Step
          </button>
        </div>
      </div>

      <mat-dialog-content
        class="flex flex-col gap-2.5 text-slate-300 text-sm p-0 border-0 bg-transparent font-sans">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Figure CSS Classes</mat-label>
          <input
            matInput
            [ngModel]="innerFigureClass()"
            (ngModelChange)="setInnerFigureClass($event)"
            placeholder="e.g. recipe-step-image" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Image CSS Classes</mat-label>
          <input
            matInput
            [ngModel]="imgClass()"
            (ngModelChange)="setImgClass($event)"
            placeholder="e.g. rounded-xl mx-auto w-full" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Caption Text (&lt;figcaption&gt;)</mat-label>
          <textarea
            matInput
            rows="2"
            [ngModel]="captionText()"
            (ngModelChange)="setCaptionText($event)"
            placeholder="Optional image caption description..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Caption CSS Classes</mat-label>
          <input
            matInput
            [ngModel]="captionClass()"
            (ngModelChange)="setCaptionClass($event)"
            placeholder="e.g. text-sm text-slate-400 mt-2 italic font-sans" />
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions class="flex justify-end gap-2.5 pt-4 p-0 border-0 bg-transparent">
        <button
          mat-button
          type="button"
          (click)="dialogRef.close()"
          class="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white transition cursor-pointer">
          Cancel
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="onApply()"
          class="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition cursor-pointer">
          Apply Figure
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FigureDialogComponent {
  readonly dialogRef = inject(MatDialogRef<FigureDialogComponent>);
  readonly data = inject<FigureDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly outerFigureClass = signal<string>(this.data?.outerFigureClass || '');
  readonly innerFigureClass = signal<string>(this.data?.innerFigureClass || '');
  readonly imgClass = signal<string>(this.data?.imgClass || '');
  readonly captionText = signal<string>(this.data?.captionText || '');
  readonly captionClass = signal<string>(this.data?.captionClass || '');

  setOuterFigureClass(v: string): void {
    this.outerFigureClass.set(v);
  }

  setInnerFigureClass(v: string): void {
    this.innerFigureClass.set(v);
  }

  setImgClass(v: string): void {
    this.imgClass.set(v);
  }

  setCaptionText(v: string): void {
    this.captionText.set(v);
  }

  setCaptionClass(v: string): void {
    this.captionClass.set(v);
  }

  readonly currentColumn = computed<'none' | 'column-2' | 'column-3'>(() => {
    const cls = this.outerFigureClass();
    if (cls.includes('column-2')) return 'column-2';
    if (cls.includes('column-3')) return 'column-3';
    return 'none';
  });

  applyPreset(type: 'gallery-2' | 'gallery-3' | 'single-step'): void {
    let inner = this.innerFigureClass()
      .replace(/\bcolumn-2\b/g, '')
      .replace(/\bcolumn-3\b/g, '')
      .trim();

    if (!inner.includes('recipe-step-image') && !inner.includes('recipe-image')) {
      inner = `recipe-step-image ${inner}`.trim();
    }
    this.innerFigureClass.set(inner.replace(/\s+/g, ' ').trim());

    if (type === 'single-step') {
      this.outerFigureClass.set('');
      return;
    }

    let outer = this.outerFigureClass()
      .replace(/\bcolumn-2\b/g, '')
      .replace(/\bcolumn-3\b/g, '')
      .trim();

    if (!outer.includes('recipe-gallery')) {
      outer = `recipe-gallery ${outer}`.trim();
    }

    if (type === 'gallery-2') {
      outer = `${outer} column-2`.trim();
    } else if (type === 'gallery-3') {
      outer = `${outer} column-3`.trim();
    }

    this.outerFigureClass.set(outer.replace(/\s+/g, ' ').trim());
  }

  onApply(): void {
    const result: FigureDialogData = {
      outerFigureClass: this.outerFigureClass().trim(),
      innerFigureClass: this.innerFigureClass().trim(),
      imgClass: this.imgClass().trim(),
      captionText: this.captionText().trim(),
      captionClass: this.captionClass().trim(),
    };
    this.dialogRef.close(result);
  }
}
