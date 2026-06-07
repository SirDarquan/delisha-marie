import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockDialogData: ConfirmDialogData = {
    title: 'Test Warning Title',
    message: 'Test Warning Message Content',
    stayLabel: 'Keep Editing',
    leaveLabel: 'Discard Changes',
  };

  beforeEach(async () => {
    mockDialogRef.close.mockClear();

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render dynamic dialog content', () => {
    expect(component).toBeTruthy();

    // Check title text
    const titleEl = fixture.debugElement.query(By.css('[mat-dialog-title]'));
    expect(titleEl.nativeElement.textContent).toContain('Test Warning Title');

    // Check message text
    const contentEl = fixture.debugElement.query(By.css('mat-dialog-content'));
    expect(contentEl.nativeElement.textContent).toContain('Test Warning Message Content');

    // Check buttons labels
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons[0].nativeElement.textContent).toContain('Keep Editing');
    expect(buttons[1].nativeElement.textContent).toContain('Discard Changes');
  });

  it('should close dialog with false when clicking the stay button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons[0].nativeElement.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when clicking the leave button', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons[1].nativeElement.click();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should have aria-hidden="true" on the warning icon to prevent reading raw icon text', () => {
    const iconEl = fixture.debugElement.query(By.css('.material-icons'));
    expect(iconEl.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render the default "warning" icon if no icon is specified in data', () => {
    const iconEl = fixture.debugElement.query(By.css('.material-icons'));
    expect(iconEl.nativeElement.textContent.trim()).toBe('warning');
  });

  it('should render a custom icon if specified in data', async () => {
    const customData: ConfirmDialogData = {
      title: 'Custom Title',
      message: 'Custom Msg',
      stayLabel: 'Stay',
      leaveLabel: 'Leave',
      icon: 'info',
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: customData },
      ],
    }).compileComponents();

    const customFixture = TestBed.createComponent(ConfirmDialogComponent);
    customFixture.detectChanges();
    const iconEl = customFixture.debugElement.query(By.css('.material-icons'));
    expect(iconEl.nativeElement.textContent.trim()).toBe('info');
  });
});
