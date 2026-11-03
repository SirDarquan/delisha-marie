import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  OnDestroy,
  linkedSignal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

export interface ScheduleDialogData {
  initialDate?: Date | null;
}

type DialogStep = 'date' | 'time' | 'confirm';
type TimeInfo = 'hour' | 'minute' | 'ampm';

@Component({
  selector: 'app-schedule-publication-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
  ],
  template: `
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-w-[350px] shadow-2xl backdrop-blur-md flex flex-col text-white">
      <!-- HEADER -->
      <h2
        mat-dialog-title
        class="text-xl font-bold mb-4 p-0 border-0 flex items-center gap-2 select-none">
        <span class="material-icons text-amber-500" aria-hidden="true">event_available</span>
        Schedule Publication
      </h2>

      <mat-dialog-content class="p-0 mb-6 flex-1 min-h-[300px] flex flex-col">
        <!-- STEP 1: DATE PICKER -->
        @if (step() === 'date') {
          <div class="flex-1 flex flex-col items-center justify-center animate-fadeIn w-full">
            <h3 class="text-sm font-semibold text-slate-300 mb-4">Select a date:</h3>
            <!-- Inline calendar -->
            <div
              class="w-full max-w-[320px] bg-slate-800 rounded-xl overflow-hidden p-2 border border-slate-700 shadow-inner">
              <mat-calendar
                [selected]="selectedDate()"
                (selectedChange)="onDateSelected($event)"></mat-calendar>
            </div>
          </div>
        }

        <!-- STEP 2: TIME PICKER -->
        @if (step() === 'time') {
          <div class="flex-1 flex flex-col items-center animate-fadeIn w-full">
            <h3 class="text-sm font-semibold text-slate-300 mb-4">Select a time:</h3>

            <div class="w-full flex justify-end mb-2 pr-4">
              <mat-checkbox
                [ngModel]="is24Hour()"
                (ngModelChange)="is24Hour.set($event); onTimeFormatChange()"
                class="text-xs text-slate-400">
                24-Hour Clock
              </mat-checkbox>
            </div>

            <!-- Scroll Wheel Container -->
            <div
              class="relative flex gap-4 h-[280px] w-full max-w-[280px] bg-slate-800/50 rounded-xl p-4 overflow-hidden border border-slate-700/50 select-none">
              <!-- Selection Highlight Bar -->
              <div
                class="absolute top-[120px] left-2 right-2 h-[40px] bg-amber-500/20 border-y border-amber-500/50 rounded pointer-events-none z-0"></div>

              <!-- HOURS -->
              <div
                class="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
                #hoursScroll
                (scroll)="onScroll('hour', $event)">
                <div class="h-[120px]"></div>
                <!-- Padding Top (3 items) -->
                @for (h of hoursList(); track $index) {
                  <div
                    class="h-[40px] flex items-center justify-center snap-center text-xl font-bold cursor-pointer transition-colors"
                    [class.text-amber-400]="h === selectedHour()"
                    [class.text-slate-500]="h !== selectedHour()"
                    (click)="scrollToItem('hour', h)"
                    (keydown.enter)="scrollToItem('hour', h)"
                    (keydown.space)="scrollToItem('hour', h)"
                    tabindex="0">
                    {{ h | number: '2.0' }}
                  </div>
                }
                <div class="h-[120px]"></div>
                <!-- Padding Bottom (3 items) -->
              </div>

              <!-- COLON SEPARATOR -->
              <div
                class="flex items-center justify-center font-bold text-2xl text-slate-400 z-10 h-full pb-1">
                :
              </div>

              <!-- MINUTES -->
              <div
                class="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
                #minutesScroll
                (scroll)="onScroll('minute', $event)">
                <div class="h-[120px]"></div>
                @for (m of minutesList; track $index) {
                  <div
                    class="h-[40px] flex items-center justify-center snap-center text-xl font-bold cursor-pointer transition-colors"
                    [class.text-amber-400]="m === selectedMinute()"
                    [class.text-slate-500]="m !== selectedMinute()"
                    (click)="scrollToItem('minute', m)"
                    (keydown.enter)="scrollToItem('minute', m)"
                    (keydown.space)="scrollToItem('minute', m)"
                    tabindex="0">
                    {{ m | number: '2.0' }}
                  </div>
                }
                <div class="h-[120px]"></div>
              </div>

              <!-- AM/PM -->
              @if (!is24Hour()) {
                <div
                  class="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
                  #ampmScroll
                  (scroll)="onScroll('ampm', $event)">
                  <div class="h-[120px]"></div>
                  @for (ap of ampmList; track ap) {
                    <div
                      class="h-[40px] flex items-center justify-center snap-center text-lg font-bold cursor-pointer transition-colors"
                      [class.text-amber-400]="ap === selectedAmPm()"
                      [class.text-slate-500]="ap !== selectedAmPm()"
                      (click)="scrollToItem('ampm', ap)"
                      (keydown.enter)="scrollToItem('ampm', ap)"
                      (keydown.space)="scrollToItem('ampm', ap)"
                      tabindex="0">
                      {{ ap }}
                    </div>
                  }
                  <div class="h-[120px]"></div>
                </div>
              }
            </div>
          </div>
        }

        <!-- STEP 3: CONFIRM -->
        @if (step() === 'confirm') {
          <div
            class="flex-1 flex flex-col items-center justify-center animate-fadeIn text-center space-y-4">
            <div
              class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-2 border border-amber-500/40">
              <span class="material-icons text-amber-500 text-3xl">event_available</span>
            </div>
            <h3 class="text-xl font-bold text-white">Confirm Publication</h3>
            <p class="text-slate-300 text-sm max-w-[250px]">
              This recipe will be scheduled to go live on:
            </p>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 w-full">
              <div class="text-lg font-bold text-amber-400">
                {{ finalDateTime() | date: 'fullDate' }}
              </div>
              <div class="text-2xl font-bold text-white mt-1">
                {{ finalDateTime() | date: 'shortTime' }}
              </div>
            </div>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions class="flex justify-between gap-3 p-0 border-0 m-0 w-full">
        @if (step() === 'date') {
          <button
            mat-button
            type="button"
            (click)="dialogRef.close(null)"
            class="text-slate-400 hover:text-slate-200 cursor-pointer">
            Cancel
          </button>
          <button
            mat-flat-button
            class="bg-amber-500 text-slate-900 font-bold px-6 rounded-xl cursor-pointer"
            [disabled]="!selectedDate()"
            (click)="nextStep()">
            OK
          </button>
        } @else if (step() === 'time') {
          <button
            mat-button
            type="button"
            (click)="prevStep()"
            class="text-slate-400 hover:text-slate-200 cursor-pointer">
            Cancel
          </button>
          <button
            mat-flat-button
            class="bg-amber-500 text-slate-900 font-bold px-6 rounded-xl cursor-pointer"
            (click)="nextStep()">
            OK
          </button>
        } @else if (step() === 'confirm') {
          <button
            mat-button
            type="button"
            (click)="dialogRef.close(null)"
            class="text-slate-400 hover:text-slate-200 cursor-pointer">
            Cancel
          </button>
          <button
            mat-flat-button
            class="bg-amber-500 text-slate-900 font-bold px-6 rounded-xl cursor-pointer"
            (click)="confirm()">
            OK
          </button>
        }
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
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      ::ng-deep .mat-calendar {
        background: transparent !important;
        color: white !important;
      }
      ::ng-deep .mat-calendar-header button,
      ::ng-deep .mat-calendar-header button * {
        color: white !important;
        fill: white !important;
      }
      ::ng-deep .mat-calendar-table-header th {
        color: #94a3b8 !important;
      }
      ::ng-deep .mat-calendar-body-cell-content {
        color: #e2e8f0 !important;
      }
      ::ng-deep .mat-calendar-body-selected {
        background-color: #f59e0b !important;
        color: #0f172a !important;
      }
      ::ng-deep .mat-calendar-arrow {
        fill: white !important;
      }
      ::ng-deep .mat-calendar-previous-button,
      ::ng-deep .mat-calendar-next-button {
        color: white !important;
      }
      ::ng-deep .mat-calendar-body-today:not(.mat-calendar-body-selected) {
        border: 1px solid #f59e0b !important;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.5) !important;
      }
    `,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePublicationDialogComponent implements OnDestroy {
  readonly dialogRef = inject(MatDialogRef<SchedulePublicationDialogComponent>);
  readonly data = inject<ScheduleDialogData>(MAT_DIALOG_DATA);

  // Determine initial state using passed data or defaulting to "Today"
  readonly initialState = computed(() => {
    const now = new Date();
    let initDate = now;

    if (this.data?.initialDate) {
      const parsed = new Date(this.data.initialDate);
      // Ensure the initial date isn't in the past (which means it defaults to now)
      if (!Number.isNaN(parsed.getTime()) && parsed >= now) {
        initDate = parsed;
      }
    }
    return initDate;
  });

  // State
  step = signal<DialogStep>('date');

  // Use linkedSignal for selectedDate so it automatically derives its default from initialState,
  // but can be independently manipulated by the user.
  selectedDate = linkedSignal<Date, Date | null>({
    source: this.initialState,
    computation: (initial) => new Date(initial),
  });

  is24Hour = signal<boolean>(false);

  selectedHour = linkedSignal<Date, number>({
    source: this.initialState,
    computation: (initial) => {
      let h = initial.getHours();
      const is24 = untracked(() => this.is24Hour());
      if (!is24) {
        h = h % 12;
        if (h === 0) h = 12;
      }
      return h;
    },
  });

  selectedMinute = linkedSignal<Date, number>({
    source: this.initialState,
    computation: (initial) => initial.getMinutes(),
  });

  selectedAmPm = linkedSignal<Date, 'AM' | 'PM'>({
    source: this.initialState,
    computation: (initial) => (initial.getHours() >= 12 ? 'PM' : 'AM'),
  });

  hoursScroll = viewChild<ElementRef<HTMLDivElement>>('hoursScroll');
  minutesScroll = viewChild<ElementRef<HTMLDivElement>>('minutesScroll');
  ampmScroll = viewChild<ElementRef<HTMLDivElement>>('ampmScroll');

  // Constants - Lowering REPEAT_COUNT but it's enough to feel infinite.
  // We use 40 so the wheel has enough buffer.
  readonly ITEM_HEIGHT = 40;
  readonly REPEAT_COUNT = 40;
  readonly baseMinutesList = Array.from({ length: 60 }, (_, i) => i);
  readonly minutesList = Array.from({ length: 60 * this.REPEAT_COUNT }, (_, i) => i % 60);
  readonly ampmList = ['AM', 'PM'] as const;

  baseHoursList = computed(() => {
    return this.is24Hour()
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
  });

  hoursList = computed(() => {
    const base = this.baseHoursList();
    return Array.from({ length: base.length * this.REPEAT_COUNT }, (_, i) => base[i % base.length]);
  });

  finalDateTime = computed(() => {
    const d = this.selectedDate();
    if (!d) return null;

    const result = new Date(d);
    let h = this.selectedHour();
    const m = this.selectedMinute();

    if (!this.is24Hour()) {
      if (this.selectedAmPm() === 'PM' && h !== 12) h += 12;
      if (this.selectedAmPm() === 'AM' && h === 12) h = 0;
    }

    result.setHours(h, m, 0, 0);
    return result;
  });

  private scrollTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  ngOnDestroy() {
    Object.values(this.scrollTimeouts).forEach(clearTimeout);
  }

  onDateSelected(date: Date | null) {
    this.selectedDate.set(date);
  }

  nextStep() {
    if (this.step() === 'date') {
      if (!this.selectedDate()) return;
      this.step.set('time');

      // Use setTimeout to ensure DOM updates and `@for` blocks render before scrolling
      setTimeout(() => this.syncScrollPositions(), 150);
    } else if (this.step() === 'time') {
      this.step.set('confirm');
    }
  }

  prevStep() {
    if (this.step() === 'time') {
      this.step.set('date');
    }
  }

  confirm() {
    this.dialogRef.close(this.finalDateTime());
  }

  onTimeFormatChange() {
    // Convert current hour representation
    let h = this.selectedHour();
    if (this.is24Hour()) {
      // 12hr to 24hr
      if (this.selectedAmPm() === 'PM' && h !== 12) h += 12;
      if (this.selectedAmPm() === 'AM' && h === 12) h = 0;
    } else {
      // 24hr to 12hr
      this.selectedAmPm.set(h >= 12 ? 'PM' : 'AM');
      h = h % 12;
      if (h === 0) h = 12;
    }
    this.selectedHour.set(h);
    setTimeout(() => this.syncScrollPositions(), 50);
  }

  scrollToItem(type: TimeInfo, value: number | string) {
    if (type === 'hour') this.selectedHour.set(value as number);
    if (type === 'minute') this.selectedMinute.set(value as number);
    if (type === 'ampm') this.selectedAmPm.set(value as 'AM' | 'PM');
    this.syncScrollPositions();
  }

  syncScrollPositions() {
    this.syncScroll(
      'hour',
      this.getCenterIndex(this.baseHoursList(), this.selectedHour()),
      this.hoursScroll(),
    );
    this.syncScroll(
      'minute',
      this.getCenterIndex(this.baseMinutesList, this.selectedMinute()),
      this.minutesScroll(),
    );
    if (!this.is24Hour()) {
      this.syncScroll('ampm', this.ampmList.indexOf(this.selectedAmPm()), this.ampmScroll());
    }
  }

  getCenterIndex(baseList: number[] | readonly string[], value: number | string): number {
    const baseIndex = baseList.indexOf(value as never);
    const middleBlock = Math.floor(this.REPEAT_COUNT / 2);
    return middleBlock * baseList.length + baseIndex;
  }

  private syncScroll(type: string, index: number, elRef?: ElementRef<HTMLDivElement>) {
    if (elRef?.nativeElement && index >= 0) {
      elRef.nativeElement.scrollTo({
        top: index * this.ITEM_HEIGHT,
        behavior: 'auto',
      });
    }
  }

  onScroll(type: TimeInfo, event: Event) {
    const target = event.target as HTMLDivElement;

    if (this.scrollTimeouts[type]) {
      clearTimeout(this.scrollTimeouts[type]);
    }

    this.scrollTimeouts[type] = setTimeout(() => {
      this.handleScrollEnd(type, target.scrollTop);
    }, 150);
  }

  private handleScrollEnd(type: TimeInfo, scrollTop: number) {
    const index = Math.round(scrollTop / this.ITEM_HEIGHT);
    this.updateSelectedValue(type, index);

    if (type !== 'ampm') {
      this.checkScrollBounds(type, index);
    }
  }

  private updateSelectedValue(type: TimeInfo, index: number) {
    switch (type) {
      case 'hour': {
        const hVal = this.hoursList()[index];
        if (hVal !== undefined && hVal !== this.selectedHour()) this.selectedHour.set(hVal);
        break;
      }
      case 'minute': {
        const mVal = this.minutesList[index];
        if (mVal !== undefined && mVal !== this.selectedMinute()) this.selectedMinute.set(mVal);
        break;
      }
      case 'ampm': {
        const aVal = this.ampmList[index];
        if (aVal !== undefined && aVal !== this.selectedAmPm()) this.selectedAmPm.set(aVal);
        break;
      }
    }
  }

  private checkScrollBounds(type: 'hour' | 'minute', index: number) {
    let currentListLength: number;

    if (type === 'hour') {
      currentListLength = this.hoursList().length;
    } else {
      currentListLength = this.minutesList.length;
    }

    if (index <= 5 || index >= currentListLength - 5) {
      this.syncScrollPositions();
    }
  }
}
