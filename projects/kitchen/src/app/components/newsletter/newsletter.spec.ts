import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Newsletter } from './newsletter';
import { NewsletterService } from '../../services/newsletter.service';

describe('Newsletter', () => {
  let component: Newsletter;
  let fixture: ComponentFixture<Newsletter>;
  let mockNewsletterService: { subscribe: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockNewsletterService = {
      subscribe: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Newsletter],
      providers: [{ provide: NewsletterService, useValue: mockNewsletterService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Newsletter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the newsletter elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Get the latest recipes!');

    const emailInput = compiled.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();

    const subscribeButton = compiled.querySelector('button');
    expect(subscribeButton).toBeTruthy();
    expect(subscribeButton?.textContent).toContain('Subscribe');
  });

  it('should successfully subscribe and display success message', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const emailInput = compiled.querySelector('input[type="email"]') as HTMLInputElement;
    const form = compiled.querySelector('form') as HTMLFormElement;

    // Set email value
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Submit form
    form.dispatchEvent(new Event('submit'));

    // Wait for the async action to complete
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(mockNewsletterService.subscribe).toHaveBeenCalledWith('test@example.com');
    expect(component.isSubscribed()).toBe(true);

    const updatedHtml = fixture.nativeElement as HTMLElement;
    expect(updatedHtml.textContent).toContain('Thank you!');
    expect(updatedHtml.querySelector('form')).toBeFalsy();
  });

  it('should handle subscription failure gracefully', async () => {
    mockNewsletterService.subscribe.mockRejectedValueOnce(new Error('API Error'));

    const compiled = fixture.nativeElement as HTMLElement;
    const emailInput = compiled.querySelector('input[type="email"]') as HTMLInputElement;
    const form = compiled.querySelector('form') as HTMLFormElement;

    emailInput.value = 'error@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));

    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(mockNewsletterService.subscribe).toHaveBeenCalledWith('error@example.com');
    expect(component.isSubscribed()).toBe(false);
    expect(component.isSubmitting()).toBe(false);

    const updatedHtml = fixture.nativeElement as HTMLElement;
    expect(updatedHtml.textContent).toContain('Subscribe');
  });
});
