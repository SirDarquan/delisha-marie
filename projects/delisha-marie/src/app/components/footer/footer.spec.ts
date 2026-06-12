import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [Footer],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Footer);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render copyright', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Delisha Marie');
    expect(compiled.textContent).toContain(new Date().getFullYear().toString());
  });

  it('should scroll to top when back to top is clicked', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(vi.fn());

    const compiled = fixture.nativeElement as HTMLElement;
    const backToTopLink = compiled.querySelector('a[href="#"]') as HTMLAnchorElement;
    expect(backToTopLink).toBeTruthy();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    backToTopLink.dispatchEvent(clickEvent);
    fixture.detectChanges();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scrollToSpy.mockRestore();
  });

  it('should directly invoke scrollToTop', () => {
    const fixture = TestBed.createComponent(Footer);
    const component = fixture.componentInstance;

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(vi.fn());
    const preventDefaultSpy = vi.fn();

    const fakeEvent = {
      preventDefault: preventDefaultSpy,
    } as unknown as Event;

    component.scrollToTop(fakeEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scrollToSpy.mockRestore();
  });
});
