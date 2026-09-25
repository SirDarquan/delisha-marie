import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: MatSnackBar, useValue: mockSnackBar }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render copyright with current year', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const currentYear = new Date().getFullYear();
    expect(compiled.textContent).toContain(`© ${currentYear} Delisha Marie. Designed by The One.`);
  });

  it('should render links for About and Contact, and button for Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));

    const aboutLink = links.find((a) => a.textContent?.trim() === 'About');
    expect(aboutLink).toBeTruthy();
    expect(aboutLink?.getAttribute('href')).toBe('/about');

    const contactLink = links.find((a) => a.textContent?.trim() === 'Contact');
    expect(contactLink).toBeTruthy();
    expect(contactLink?.getAttribute('href')).toBe('/contact');

    const kitchenBtn = compiled.querySelector('.footer-links button');
    expect(kitchenBtn).toBeTruthy();
    expect(kitchenBtn?.textContent?.trim()).toBe('Kitchen');
    expect(kitchenBtn?.getAttribute('aria-label')).toContain('Coming soon');
  });

  it('should show "Coming soon" snackbar when Kitchen button in footer is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const kitchenBtn = compiled.querySelector('.footer-links button') as HTMLButtonElement;
    expect(kitchenBtn).toBeTruthy();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    kitchenBtn.dispatchEvent(event);

    expect(mockSnackBar.open).toHaveBeenCalledWith('Coming soon', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  });

  it('should scroll to top when "^ Back to the top" is clicked', () => {
    const doc = TestBed.inject(DOCUMENT);
    const scrollToSpy = vi.fn();
    const origDefaultView = doc.defaultView;
    Object.defineProperty(doc, 'defaultView', {
      value: { scrollTo: scrollToSpy },
      configurable: true,
    });

    const mockEvent = { preventDefault: vi.fn() } as unknown as Event;
    component.scrollToTop(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    Object.defineProperty(doc, 'defaultView', { value: origDefaultView, configurable: true });
  });

  it('should trigger scrollToTop when clicking "^ Back to the top" link in template', () => {
    const scrollSpy = vi.spyOn(component, 'scrollToTop');
    const compiled = fixture.nativeElement as HTMLElement;
    const backToTopLink = compiled.querySelector('a');

    backToTopLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(scrollSpy).toHaveBeenCalled();
  });
});
