import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  stayLabel: string;
  leaveLabel: string;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm shadow-2xl backdrop-blur-md">
      <h2
        mat-dialog-title
        class="text-lg font-bold text-white mb-2 p-0 border-0 flex items-center gap-2 select-none">
        <span class="material-icons text-amber-500" aria-hidden="true">{{
          data.icon || 'warning'
        }}</span>
        {{ data.title }}
      </h2>
      <mat-dialog-content class="text-slate-300 text-sm mb-6 p-0 border-0 bg-transparent font-sans">
        {{ data.message }}
      </mat-dialog-content>
      <mat-dialog-actions class="flex justify-end gap-3 p-0 border-0 bg-transparent">
        <button
          mat-button
          type="button"
          (click)="dialogRef.close(false)"
          class="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer">
          {{ data.stayLabel }}
        </button>
        <button
          mat-flat-button
          color="warn"
          type="button"
          (click)="dialogRef.close(true)"
          class="px-5 py-2.5 rounded-xl font-bold text-white transition cursor-pointer">
          {{ data.leaveLabel }}
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
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
