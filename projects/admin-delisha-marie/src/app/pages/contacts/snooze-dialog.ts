import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-snooze-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>Pick date & time</h2>
    <mat-dialog-content class="flex flex-col gap-6 pt-4">
      <div class="flex flex-col sm:flex-row gap-6">
        <!-- Inline Calendar (Left) -->
        <div
          class="bg-slate-900 border border-slate-700 rounded-xl p-4 min-w-[300px] flex items-center">
          <mat-calendar
            [(selected)]="selectedDate"
            class="custom-calendar text-white w-full !max-w-full scale-105 origin-center"></mat-calendar>
        </div>

        <!-- Inputs (Right) -->
        <div class="flex flex-col gap-6 justify-center flex-1">
          <!-- Date Picker -->
          <div class="flex flex-col gap-2">
            <label for="date-input" class="text-sm font-bold text-slate-400">Date</label>
            <div class="relative flex items-center">
              <input
                id="date-input"
                [matDatepicker]="picker"
                [(ngModel)]="selectedDate"
                class="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg pr-12" />
              <mat-datepicker #picker panelClass="custom-calendar"></mat-datepicker>
            </div>
          </div>

          <!-- Time Picker -->
          <div class="flex flex-col gap-2">
            <label for="time-input" class="text-sm font-bold text-slate-400">Time</label>
            <input
              id="time-input"
              type="time"
              [(ngModel)]="selectedTime"
              class="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" />
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="text-slate-400">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="!selectedDate || !selectedTime">
        Save
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnoozeDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SnoozeDialogComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);

  selectedDate: Date | null = new Date();
  selectedTime = '08:00';

  constructor() {
    if (this.data?.snoozed_until) {
      const d = new Date(this.data.snoozed_until);
      if (!isNaN(d.getTime())) {
        this.selectedDate = d;
        this.selectedTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    }
  }

  save() {
    if (this.selectedDate && this.selectedTime) {
      const [hours, minutes] = this.selectedTime.split(':').map(Number);
      const result = new Date(this.selectedDate);
      result.setHours(hours, minutes, 0, 0);
      this.dialogRef.close(result.toISOString());
    }
  }
}
