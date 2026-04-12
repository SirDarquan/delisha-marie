import { TestBed } from '@angular/core/testing';
import { Contact } from './contact';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Contact', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Contact, MatSnackBarModule, NoopAnimationsModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Contact);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    // Accessing protected form proxy via type cast for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = (component as any).contactForm;
    expect(form().invalid()).toBe(true);
  });

  it('should disable submit button when form is invalid', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
