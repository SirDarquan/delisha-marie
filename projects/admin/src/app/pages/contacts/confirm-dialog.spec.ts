import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Title',
            message: 'Test Message',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title and message from data', () => {
    const titleElement = fixture.debugElement.query(By.css('h2')).nativeElement;
    const messageElement = fixture.debugElement.query(By.css('p')).nativeElement;

    expect(titleElement.textContent.trim()).toBe('Test Title');
    expect(messageElement.textContent.trim()).toBe('Test Message');
  });

  it('should have a cancel button', () => {
    const cancelButton = fixture.debugElement.query(
      By.css('button[mat-dialog-close]:not([color="warn"])'),
    );
    expect(cancelButton).toBeTruthy();
  });

  it('should have a confirm button returning true', () => {
    const confirmButton = fixture.debugElement.query(By.css('button[color="warn"]'));
    expect(confirmButton).toBeTruthy();
  });
});
