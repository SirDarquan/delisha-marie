import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from '@dm/library';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let themeServiceMock: {
    isDark: WritableSignal<boolean>;
    toggle: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    themeServiceMock = {
      isDark: signal(false),
      toggle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Delisha Marie logo linking to root', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoLink = compiled.querySelector('a.logo-container');
    expect(logoLink).toBeTruthy();
    expect(logoLink?.getAttribute('href')).toBe('/');
    expect(logoLink?.textContent).toContain('Delisha');
    expect(logoLink?.textContent).toContain('Marie');
  });

  it('should render navigation links for About, Contact, and Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a');
    expect(navLinks).toHaveLength(3);

    // About link
    expect(navLinks[0].textContent).toContain('About');
    expect(navLinks[0].getAttribute('href')).toBe('/about');

    // Contact link
    expect(navLinks[1].textContent).toContain('Contact');
    expect(navLinks[1].getAttribute('href')).toBe('/contact');

    // Kitchen link
    expect(navLinks[2].textContent).toContain('Kitchen');
    expect(navLinks[2].getAttribute('href')).toBe(component.kitchenUrl);
  });

  it('should render mobile hamburger menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hamburgerBtn = compiled.querySelector('button[aria-label="Open navigation menu"]');
    expect(hamburgerBtn).toBeTruthy();
    expect(hamburgerBtn?.querySelector('mat-icon')?.textContent?.trim()).toBe('menu');
  });

  it('should render theme toggle and respond to toggle changes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector('mat-slide-toggle button');
    expect(toggle).toBeTruthy();

    toggle?.dispatchEvent(new MouseEvent('click'));
    expect(themeServiceMock.toggle).toHaveBeenCalled();
  });

  it('should reflect dark mode icon when dark mode is active', () => {
    themeServiceMock.isDark.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('mat-slide-toggle mat-icon');
    expect(icon?.textContent?.trim()).toBe('dark_mode');
  });

  it('should render dropdown menu trigger when link has children', () => {
    // Override menuLinks to include an item with children
    (component as unknown as { menuLinks: unknown[] }).menuLinks = [
      {
        label: 'More',
        children: [{ label: 'Sublink', path: '/sub' }],
      },
    ];
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const triggerBtn = compiled.querySelector('nav button');
    expect(triggerBtn?.textContent).toContain('More');
  });
});
