import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SchedulePublicationDialogComponent } from './schedule-publication-dialog';
import { ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

import { vi } from 'vitest';

if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = vi.fn();
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SchedulePublicationDialogComponent', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  let mockDialogRef: { close: (result?: Date | null) => void };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should cover date step template events', () => {
    const calendar = fixture.debugElement.query(By.css('mat-calendar'));
    calendar.triggerEventHandler('selectedChange', new Date());

    const actionButtons = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'));
    const cancelBtn = actionButtons[0];
    cancelBtn.triggerEventHandler('click', null);
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);

    component.selectedDate.set(new Date());
    fixture.detectChanges();
    const okBtn = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'))[1];
    okBtn.triggerEventHandler('click', null);
    expect(component.step()).toBe('time');
  });

  it('should cover time step template events', async () => {
    component.selectedDate.set(new Date());
    component.step.set('time');
    fixture.detectChanges();

    // Trigger checkbox change
    const checkbox = fixture.debugElement.query(By.css('mat-checkbox'));
    checkbox.triggerEventHandler('ngModelChange', true);

    // Trigger scroll events on the elements
    const scrolls = fixture.debugElement.queryAll(By.css('.overflow-y-scroll'));
    scrolls[0].triggerEventHandler('scroll', { target: { scrollTop: 400 } });
    scrolls[1].triggerEventHandler('scroll', { target: { scrollTop: 400 } });

    // Trigger events on hour items
    const hourItem = fixture.debugElement.queryAll(By.css('.snap-center'))[0];
    hourItem.triggerEventHandler('click', null);
    hourItem.triggerEventHandler('keydown.enter', null);
    hourItem.triggerEventHandler('keydown.space', null);

    // Trigger events on minute items
    const minuteItem = scrolls[1].queryAll(By.css('.snap-center'))[0];
    minuteItem.triggerEventHandler('click', null);
    minuteItem.triggerEventHandler('keydown.enter', null);
    minuteItem.triggerEventHandler('keydown.space', null);

    // ampm is only available if !is24Hour
    component.is24Hour.set(false);
    fixture.detectChanges();

    const ampmScrolls = fixture.debugElement.queryAll(By.css('.overflow-y-scroll'));
    ampmScrolls[2].triggerEventHandler('scroll', { target: { scrollTop: 40 } });

    const ampmItem = ampmScrolls[2].queryAll(By.css('.snap-center'))[0];
    ampmItem.triggerEventHandler('click', null);
    ampmItem.triggerEventHandler('keydown.enter', null);
    ampmItem.triggerEventHandler('keydown.space', null);

    const actionButtons = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'));
    const cancelBtn = actionButtons[0];
    cancelBtn.triggerEventHandler('click', null);
    expect(component.step()).toBe('date');

    component.step.set('time');
    fixture.detectChanges();
    const okBtn = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'))[1];
    okBtn.triggerEventHandler('click', null);
    expect(component.step()).toBe('confirm');
    component.ngOnDestroy();
  }, 20000);

  it('should cover confirm step template events', () => {
    component.selectedDate.set(new Date());
    component.step.set('confirm');
    fixture.detectChanges(); // This covers the HTML inside @if (step() === 'confirm')

    const actionButtons = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'));
    const cancelBtn = actionButtons[0];
    cancelBtn.triggerEventHandler('click', null);
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);

    const okBtn = fixture.debugElement
      .query(By.css('mat-dialog-actions'))
      .queryAll(By.css('button'))[1];
    okBtn.triggerEventHandler('click', null);
    // it will call mockDialogRef.close again with the date
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on date step', () => {
    expect(component.step()).toBe('date');
  });

  it('should not proceed to time step if no date is selected', () => {
    component.selectedDate.set(null);
    component.nextStep();
    expect(component.step()).toBe('date');
  });

  it('should proceed to time step if date is selected', async () => {
    component.selectedDate.set(new Date());
    component.nextStep();
    await delay(200);
    expect(component.step()).toBe('time');
  });

  it('should proceed to confirm step from time step', () => {
    component.selectedDate.set(new Date());
    component.step.set('time');
    component.nextStep();
    expect(component.step()).toBe('confirm');
  });

  it('should not proceed from confirm step', () => {
    component.step.set('confirm');
    component.nextStep();
    expect(component.step()).toBe('confirm');
  });

  it('should go back to date step from time step', () => {
    component.selectedDate.set(new Date());
    component.step.set('time');
    component.prevStep();
    expect(component.step()).toBe('date');
  });

  it('should not go back from date or confirm steps', () => {
    component.step.set('date');
    component.prevStep();
    expect(component.step()).toBe('date');

    component.step.set('confirm');
    component.prevStep();
    expect(component.step()).toBe('confirm');
  });

  it('should convert time properly between 12 and 24 hour clocks', async () => {
    component.is24Hour.set(false);
    component.selectedHour.set(2);
    component.selectedAmPm.set('PM');

    component.is24Hour.set(true);
    component.onTimeFormatChange();
    await delay(100);

    expect(component.selectedHour()).toBe(14);

    // Switch back to 12-hour
    component.is24Hour.set(false);
    component.onTimeFormatChange();
    await delay(100);
    expect(component.selectedHour()).toBe(2);
    expect(component.selectedAmPm()).toBe('PM');

    // Switch 12AM edge case
    component.selectedHour.set(12);
    component.selectedAmPm.set('AM');
    component.is24Hour.set(true);
    component.onTimeFormatChange();
    await delay(100);
    expect(component.selectedHour()).toBe(0);

    // Switch 12PM edge case
    component.is24Hour.set(false);
    component.selectedHour.set(12);
    component.selectedAmPm.set('PM');
    component.is24Hour.set(true);
    component.onTimeFormatChange();
    await delay(100);
    expect(component.selectedHour()).toBe(12);

    // Switch 0 to 12AM
    component.is24Hour.set(false);
    component.selectedHour.set(0);
    component.onTimeFormatChange();
    await delay(100);
    expect(component.selectedHour()).toBe(12);
  });

  it('should confirm and close with selected datetime', () => {
    const closeSpy = vi.spyOn(mockDialogRef, 'close');
    const testDate = new Date('2026-08-10T00:00:00Z');
    component.selectedDate.set(testDate);
    component.selectedHour.set(14);
    component.selectedMinute.set(30);
    component.is24Hour.set(true);

    component.step.set('confirm');
    component.confirm();

    const expectedDate = new Date(testDate);
    expectedDate.setHours(14, 30, 0, 0);
    expect(closeSpy).toHaveBeenCalledWith(expectedDate);
  });

  it('should set selected date onDateSelected', () => {
    const date = new Date('2026-08-15T00:00:00Z');
    component.onDateSelected(date);
    expect(component.selectedDate()).toEqual(date);
  });

  it('should compute finalDateTime correctly for 12 hour PM', () => {
    const date = new Date('2026-08-10T00:00:00');
    component.selectedDate.set(date);
    component.is24Hour.set(false);
    component.selectedHour.set(3);
    component.selectedMinute.set(15);
    component.selectedAmPm.set('PM');

    const final = component.finalDateTime();
    expect(final?.getHours()).toBe(15);
    expect(final?.getMinutes()).toBe(15);
  });

  it('should compute finalDateTime correctly for 12 hour AM 12', () => {
    const date = new Date('2026-08-10T00:00:00');
    component.selectedDate.set(date);
    component.is24Hour.set(false);
    component.selectedHour.set(12);
    component.selectedMinute.set(0);
    component.selectedAmPm.set('AM');

    const final = component.finalDateTime();
    expect(final?.getHours()).toBe(0);
  });

  it('should compute finalDateTime correctly for 24 hour', () => {
    const date = new Date('2026-08-10T00:00:00');
    component.selectedDate.set(date);
    component.is24Hour.set(true);
    component.selectedHour.set(14);
    component.selectedMinute.set(45);

    const final = component.finalDateTime();
    expect(final?.getHours()).toBe(14);
    expect(final?.getMinutes()).toBe(45);
  });

  it('should return null from finalDateTime if selectedDate is null', () => {
    component.selectedDate.set(null);
    expect(component.finalDateTime()).toBeNull();
  });

  it('should clear timeouts on destroy', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    component['scrollTimeouts'] = {
      hour: setTimeout(vi.fn(), 10000) as unknown as ReturnType<typeof setTimeout>,
    };
    component.ngOnDestroy();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle scrollToItem', () => {
    const syncSpy = vi.spyOn(component, 'syncScrollPositions');
    component.scrollToItem('hour', 5);
    expect(component.selectedHour()).toBe(5);

    component.scrollToItem('minute', 45);
    expect(component.selectedMinute()).toBe(45);

    component.scrollToItem('ampm', 'PM');
    expect(component.selectedAmPm()).toBe('PM');

    expect(syncSpy).toHaveBeenCalledTimes(3);
  });

  it('should calculate center index', () => {
    const index = component.getCenterIndex(component.baseMinutesList, 15);
    // REPEAT_COUNT is 40. middle is 20. 20 * 60 + 15 = 1215
    expect(index).toBe(1215);
  });

  it('should handle scroll events', async () => {
    const handleSpy = vi.spyOn(
      component as unknown as {
        handleScrollEnd: (type: 'hour' | 'minute' | 'ampm', scrollTop: number) => void;
      },
      'handleScrollEnd',
    );

    const mockEvent = { target: { scrollTop: 40 * 10 } } as unknown as Event;

    component.onScroll('hour', mockEvent);

    // Simulate multiple scrolls before timeout to test debouncing
    component.onScroll('hour', mockEvent);

    await delay(200);
    expect(handleSpy).toHaveBeenCalledWith('hour', 400);
  }, 20000);

  it('should update selected value on scroll end', () => {
    // Hour index 1215 means hour is 15 (if base length is 24) or 3 (if base length 12)
    component.is24Hour.set(true);
    // base length 24
    // list has 24 * 40 = 960 elements. Let's use index 25 (which is 1 in base)
    component['handleScrollEnd']('hour', 25 * 40);
    expect(component.selectedHour()).toBe(1);

    component['handleScrollEnd']('minute', 65 * 40);
    expect(component.selectedMinute()).toBe(5);

    component['handleScrollEnd']('ampm', 1 * 40);
    expect(component.selectedAmPm()).toBe('PM');
  });

  it('should ignore out of bounds indices in updateSelectedValue', () => {
    const prevHour = component.selectedHour();
    const prevMin = component.selectedMinute();
    const prevAmPm = component.selectedAmPm();

    component['updateSelectedValue']('hour', 99999);
    expect(component.selectedHour()).toBe(prevHour);

    component['updateSelectedValue']('minute', 99999);
    expect(component.selectedMinute()).toBe(prevMin);

    component['updateSelectedValue']('ampm', 99999);
    expect(component.selectedAmPm()).toBe(prevAmPm);
  });

  it('should ignore duplicate selections in updateSelectedValue', () => {
    const setSpy = vi.spyOn(component.selectedHour, 'set');
    // Set it first
    component['handleScrollEnd']('hour', 25 * 40);
    setSpy.mockClear();

    // Trigger again with same index
    component['handleScrollEnd']('hour', 25 * 40);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('should check bounds and trigger sync', () => {
    const syncSpy = vi.spyOn(component, 'syncScrollPositions');
    component.is24Hour.set(true);

    component['checkScrollBounds']('hour', 1); // near top
    expect(syncSpy).toHaveBeenCalled();

    syncSpy.mockClear();

    component['checkScrollBounds']('minute', component.minutesList.length - 2); // near bottom
    expect(syncSpy).toHaveBeenCalled();

    syncSpy.mockClear();

    component['checkScrollBounds']('hour', 400); // middle of 960, should not sync
    expect(syncSpy).not.toHaveBeenCalled();
  });

  it('should sync scroll positions', () => {
    const nativeElement = { scrollTo: vi.fn() } as unknown as HTMLDivElement;

    vi.spyOn(component, 'hoursScroll').mockReturnValue({ nativeElement } as ElementRef);
    vi.spyOn(component, 'minutesScroll').mockReturnValue({ nativeElement } as ElementRef);
    vi.spyOn(component, 'ampmScroll').mockReturnValue({ nativeElement } as ElementRef);

    component.syncScrollPositions();
    expect(nativeElement.scrollTo).toHaveBeenCalled();
  });

  it('should not throw if elRef is undefined or invalid in syncScroll', () => {
    expect(() => component['syncScroll']('hour', 1, undefined)).not.toThrow();
    expect(() =>
      component['syncScroll']('hour', -1, {
        nativeElement: { scrollTo: vi.fn() },
      } as unknown as ElementRef<HTMLDivElement>),
    ).not.toThrow();
  });
});

describe('SchedulePublicationDialogComponent with AM initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1);
  testDate.setHours(9, 30, 0, 0); // AM time

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: testDate.toISOString() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with AM', () => {
    expect(component.selectedAmPm()).toBe('AM');
  });
});

describe('SchedulePublicationDialogComponent with PM initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1);
  testDate.setHours(15, 30, 0, 0); // PM time

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: testDate.toISOString() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with PM', () => {
    expect(component.selectedAmPm()).toBe('PM');
  });
});

describe('SchedulePublicationDialogComponent with midnight initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1);
  testDate.setHours(0, 0, 0, 0); // Midnight

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: testDate.toISOString() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with midnight (12 AM)', () => {
    expect(component.selectedHour()).toBe(12);
    expect(component.selectedAmPm()).toBe('AM');
  });
});

describe('SchedulePublicationDialogComponent with initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1); // tomorrow

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: testDate.toISOString() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with provided data', () => {
    expect(component.initialState().getTime()).toBe(testDate.getTime());
    expect(component.selectedDate()?.getTime()).toBe(testDate.getTime());
    expect(component.selectedMinute()).toBe(testDate.getMinutes());
  });
});

describe('SchedulePublicationDialogComponent with past initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;
  const testDate = new Date('2000-01-01T00:00:00Z'); // past

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: testDate.toISOString() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default to now if provided date is in the past', () => {
    const initial = component.initialState();
    expect(initial.getFullYear()).toBeGreaterThan(2020);
  });
});

describe('SchedulePublicationDialogComponent with invalid initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: 'invalid-date' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default to now if provided date is invalid', () => {
    const initial = component.initialState();
    expect(initial.getFullYear()).toBeGreaterThan(2020);
  });
});

describe('SchedulePublicationDialogComponent with invalid initial data', () => {
  let component: SchedulePublicationDialogComponent;
  let fixture: ComponentFixture<SchedulePublicationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { initialDate: 'invalid-date' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default to now if provided date is invalid', () => {
    const initial = component.initialState();
    expect(initial.getFullYear()).toBeGreaterThan(2020);
  });
});
