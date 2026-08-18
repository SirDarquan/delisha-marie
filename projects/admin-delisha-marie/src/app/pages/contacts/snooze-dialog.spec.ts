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

    component.save();

    const expectedResult = new Date(testDate);
    expectedResult.setHours(12, 30, 0, 0);

    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult.toISOString());
  });

  it('should not close if date or time is missing', () => {
    component.selectedDate = null;
    component.save();
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    component.selectedDate = new Date();
    component.selectedTime = '';
    component.save();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
