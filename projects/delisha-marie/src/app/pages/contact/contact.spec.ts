import { TestBed } from '@angular/core/testing';
import { Contact } from './contact';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

interface ContactTestInstance {
  contactForm: () => { invalid: () => boolean };
  userModel: {
    set: (v: { name: string; email: string; subject: string; message: string }) => void;
  };
}

describe('Contact', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Contact, MatSnackBarModule],
      providers: [provideRouter([])],
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

    const testInstance = component as unknown as ContactTestInstance;
    const form = testInstance.contactForm;
    expect(form().invalid()).toBe(true);
  });

  it('should disable submit button when form is invalid', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const testInstance = component as unknown as ContactTestInstance;
    const userModel = testInstance.userModel;
    userModel.set({
      name: 'Test',
      email: 'test@example.com',
      subject: 'Hello',
      message: 'This is a test message',
    });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
  });

  it('should render the sidebar', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dml-sidebar')).toBeTruthy();
  });
});
