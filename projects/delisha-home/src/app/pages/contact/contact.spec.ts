import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact } from './contact';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;
  let httpTesting: HttpTestingController;
  let mockSnackBar: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    mockSnackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the contact page', () => {
    expect(component).toBeTruthy();
  });

  it('should render colored header and contact info cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('h1')?.textContent).toContain('Get');
    expect(compiled.querySelector('h1')?.textContent).toContain('in Touch');
    expect(compiled.textContent).toContain('Collaborations');
    expect(compiled.textContent).toContain('Recipe Questions');
  });

  it('should render form fields inside the contact box with preserved subject placeholder', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[placeholder="Joe Smith"]')).toBeTruthy();
    expect(compiled.querySelector('input[placeholder="yourname@example.com"]')).toBeTruthy();
    expect(
      compiled.querySelector('input[placeholder="Recipe question / collaboration inquiry"]'),
    ).toBeTruthy();
    expect(
      compiled.querySelector('textarea[placeholder="Your beautiful message..."]'),
    ).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('should display validation errors including Subject is required when submitting an empty form', async () => {
    const { submit } = await import('@angular/forms/signals');
    await submit(component['contactForm']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Name is required');
    expect(compiled.textContent).toContain('Email is required');
    expect(compiled.textContent).toContain('Subject is required');
    expect(compiled.textContent).toContain('Message is required');
  });

  it('should display email invalid error when email format is incorrect', async () => {
    component['userModel'].set({
      name: 'Test',
      email: 'not-an-email',
      subject: 'Valid Subject',
      message: 'Test message',
    });
    fixture.detectChanges();

    const { submit } = await import('@angular/forms/signals');
    await submit(component['contactForm']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Email is invalid');
  });

  it('should post payload to API and submit form when valid data is provided', async () => {
    component['userModel'].set({
      name: 'Jordan',
      email: 'jordan@example.com',
      subject: 'Event inquiry',
      message: 'Can you cater a small dinner party?',
    });
    fixture.detectChanges();

    const { submit } = await import('@angular/forms/signals');
    const submitPromise = submit(component['contactForm']);
    fixture.detectChanges();

    expect(component['isSubmitting']()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url.includes('/api/contacts'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Jordan',
      email: 'jordan@example.com',
      subject: 'Event inquiry',
      message: 'Can you cater a small dinner party?',
    });
    req.flush({ success: true });

    await submitPromise;
    fixture.detectChanges();

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
  });

  it('should handle API error gracefully and display error snackbar', async () => {
    component['userModel'].set({
      name: 'Alex',
      email: 'alex@example.com',
      subject: 'Help',
      message: 'Missing ingredient inquiry.',
    });
    fixture.detectChanges();

    const { submit } = await import('@angular/forms/signals');
    const submitPromise = submit(component['contactForm']);
    fixture.detectChanges();

    expect(component['isSubmitting']()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url.includes('/api/contacts'));
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await submitPromise;
    fixture.detectChanges();

    expect(mockSnackBar['open']).toHaveBeenCalledWith(
      'Failed to send message. Please try again later.',
      'Close',
      { duration: 5000 },
    );
    expect(component['isSubmitting']()).toBe(false);
  });
});
