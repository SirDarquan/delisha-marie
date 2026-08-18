import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactForm } from './contact-form';
import { MatSnackBar } from '@angular/material/snack-bar';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('ContactForm', () => {
  let component: ContactForm;
  let fixture: ComponentFixture<ContactForm>;
  let mockSnackBar: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    mockSnackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContactForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(ContactForm, {
        set: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ContactForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit form successfully', async () => {
    vi.useFakeTimers();
    // Fill the form by updating the bound signal
    component['userModel'].set({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'Hello there!',
    });
    fixture.detectChanges();

    // Trigger submission
    const { submit } = await import('@angular/forms/signals');
    submit(component['contactForm']);

    // It should immediately be submitting
    expect(component['isSubmitting']()).toBe(true);

    const httpTestingController = TestBed.inject(HttpTestingController);
    const req = httpTestingController.expectOne('/api/contacts');
    expect(req.request.method).toEqual('POST');
    req.flush({ success: true });

    // Wait for the async action to complete
    vi.advanceTimersByTime(1500);
    await Promise.resolve(); // flush microtasks
    fixture.detectChanges();

    // Assertions
    expect(mockSnackBar['open']).toHaveBeenCalledWith(
      'Message sent successfully! Delisha will get back to you soon.',
      'Close',
      { duration: 5000, panelClass: ['success-snackbar'] },
    );
    expect(component['isSubmitting']()).toBe(false);
    expect(component['userModel']().name).toBe('');
    expect(component['userModel']().email).toBe('');
    expect(component['userModel']().subject).toBe('');
    expect(component['userModel']().message).toBe('');

    vi.useRealTimers();
  });
});
