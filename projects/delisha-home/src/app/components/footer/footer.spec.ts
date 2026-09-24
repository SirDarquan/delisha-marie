import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
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

  it('should render links for About, Contact, and Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));

    const aboutLink = links.find((a) => a.textContent?.trim() === 'About');
    expect(aboutLink).toBeTruthy();
    expect(aboutLink?.getAttribute('href')).toBe('/about');

    const contactLink = links.find((a) => a.textContent?.trim() === 'Contact');
    expect(contactLink).toBeTruthy();
    expect(contactLink?.getAttribute('href')).toBe('/contact');

    const kitchenLink = links.find((a) => a.textContent?.trim() === 'Kitchen');
    expect(kitchenLink).toBeTruthy();
    expect(kitchenLink?.getAttribute('href')).toBe(component.kitchenUrl);
    expect(component.kitchenUrl).toContain('');
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
