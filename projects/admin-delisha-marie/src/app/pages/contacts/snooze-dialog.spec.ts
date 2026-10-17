import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { SnoozeDialogComponent } from './snooze-dialog';

describe('SnoozeDialogComponent', () => {
  let component: SnoozeDialogComponent;
  let fixture: ComponentFixture<SnoozeDialogComponent>;
  let mockDialogRef: { close: unknown };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SnoozeDialogComponent, FormsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { snoozed_until: '2026-08-18T14:00:00.000Z' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SnoozeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided data', () => {
    expect(component.selectedDate).toBeInstanceOf(Date);
    const expectedTime = `${component.selectedDate?.getHours().toString().padStart(2, '0')}:${component.selectedDate?.getMinutes().toString().padStart(2, '0')}`;
    expect(component.selectedTime).toBe(expectedTime);
  });

  it('should save properly and close dialog with iso string', () => {
    const testDate = new Date();
    component.selectedDate = testDate;
    component.selectedTime = '12:30';

    fixture.debugElement
      .query(By.css('button[mat-flat-button]'))
      .triggerEventHandler('click', null);

    const expectedResult = new Date(testDate);
    expectedResult.setHours(12, 30, 0, 0);

    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult.toISOString());
  });

  it('should not close if date or time is missing', () => {
    component.selectedDate = null;
    fixture.debugElement
      .query(By.css('button[mat-flat-button]'))
      .triggerEventHandler('click', null);
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    component.selectedDate = new Date();
    component.selectedTime = '';
    fixture.debugElement
      .query(By.css('button[mat-flat-button]'))
      .triggerEventHandler('click', null);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should handle template two-way bindings and invalid/null dialog data', () => {
    const calendar = fixture.debugElement.query(By.css('mat-calendar'));
    const newDate = new Date(2026, 9, 15);
    calendar.triggerEventHandler('selectedChange', newDate);
    expect(component.selectedDate).toBe(newDate);

    const dateInput = fixture.debugElement.query(By.css('#date-input'));
    const anotherDate = new Date(2026, 9, 20);
    dateInput.triggerEventHandler('ngModelChange', anotherDate);
    expect(component.selectedDate).toBe(anotherDate);

    const timeInput = fixture.debugElement.query(By.css('#time-input'));
    timeInput.triggerEventHandler('ngModelChange', '15:45');
    expect(component.selectedTime).toBe('15:45');

    // Also test constructor when data is invalid or null
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SnoozeDialogComponent, FormsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { snoozed_until: 'invalid-date' } },
      ],
    });
    const invalidFixture = TestBed.createComponent(SnoozeDialogComponent);
    expect(invalidFixture.componentInstance.selectedTime).toBe('08:00');
  });
});
