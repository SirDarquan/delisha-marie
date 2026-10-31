import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from '../theme/theme.service';
import { HeaderNav } from './header-nav';
import { MenuLink } from '../types/menu';

describe('HeaderNav', () => {
  let fixture: ComponentFixture<HeaderNav>;
  let component: HeaderNav;
  let themeServiceMock: {
    isDark: WritableSignal<boolean>;
    toggle: ReturnType<typeof vi.fn>;
  };

  const testLinks: MenuLink[] = [
    { label: 'About', path: '/about', icon: 'info' },
    { label: 'PlainLink', path: '/plain' }, // no icon
    { label: 'External', externalUrl: 'https://example.com', icon: 'open_in_new' },
    { label: 'PlainExternal', externalUrl: 'https://plain.com' }, // no icon
    {
      label: 'Parent',
      icon: 'folder',
      children: [
        { label: 'Child 1', path: '/child-1', icon: 'description' },
        { label: 'Child 2', path: '/child-2' },
      ],
    },
    {
      label: 'PlainParent',
      children: [{ label: 'Sub', path: '/sub' }],
    },
  ];

  beforeEach(async () => {
    themeServiceMock = {
      isDark: signal(false),
      toggle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderNav],
      providers: [provideRouter([]), { provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderNav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default empty links', () => {
    expect(component).toBeTruthy();
    expect(component.menuLinks()).toEqual([]);
  });

  it('should render desktop navigation links including internal, external, and submenus', () => {
    fixture.componentRef.setInput('menuLinks', testLinks);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const desktopNav = compiled.querySelector('nav');
    expect(desktopNav).toBeTruthy();

    const links = desktopNav?.querySelectorAll('a');
    expect(links).toHaveLength(4); // About, PlainLink, External, PlainExternal

    // Check About link with icon
    expect(links?.[0].textContent).toContain('About');
    expect(links?.[0].querySelector('mat-icon')?.textContent?.trim()).toBe('info');

    // Check PlainLink without icon
    expect(links?.[1].textContent).toContain('PlainLink');
    expect(links?.[1].querySelector('mat-icon')).toBeNull();

    // Check External link with icon
    expect(links?.[2].textContent).toContain('External');
    expect(links?.[2].querySelector('mat-icon')?.textContent?.trim()).toBe('open_in_new');

    // Check PlainExternal without icon
    expect(links?.[3].textContent).toContain('PlainExternal');
    expect(links?.[3].querySelector('mat-icon')).toBeNull();

    // Check Parent dropdown button with icon
    const buttons = desktopNav?.querySelectorAll('button');
    expect(buttons?.[0].textContent).toContain('Parent');
    expect(buttons?.[0].textContent).toContain('arrow_drop_down');

    // Check PlainParent without icon
    expect(buttons?.[1].textContent).toContain('PlainParent');
  });

  it('should render mobile menu with hamburger button and open menu', () => {
    fixture.componentRef.setInput('menuLinks', testLinks);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mobileContainer = compiled.querySelector('.md\\:hidden');
    expect(mobileContainer).toBeTruthy();

    const hamburgerBtn = mobileContainer?.querySelector(
      'button[aria-label="Open navigation menu"]',
    ) as HTMLButtonElement;
    expect(hamburgerBtn).toBeTruthy();

    // Click hamburger button to open mat-menu
    hamburgerBtn.click();
    fixture.detectChanges();

    // The mat-menu content should be attached to the overlay
    const overlayItems = document.querySelectorAll('.mat-mdc-menu-item');
    expect(overlayItems.length).toBeGreaterThan(0);
  });

  it('should toggle theme when desktop and mobile slide toggles are clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleButtons = compiled.querySelectorAll('mat-slide-toggle button');
    expect(toggleButtons.length).toBeGreaterThanOrEqual(1);

    toggleButtons[0]?.dispatchEvent(new MouseEvent('click'));
    expect(themeServiceMock.toggle).toHaveBeenCalled();

    if (toggleButtons.length > 1) {
      toggleButtons[1]?.dispatchEvent(new MouseEvent('click'));
      expect(themeServiceMock.toggle).toHaveBeenCalledTimes(2);
    }
  });

  it('should reflect dark mode icon when dark mode is true', () => {
    themeServiceMock.isDark.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('mat-slide-toggle mat-icon');
    icons.forEach((icon) => {
      expect(icon.textContent?.trim()).toBe('dark_mode');
    });
  });

  it('should hide theme toggle when showThemeToggle is set to false', () => {
    fixture.componentRef.setInput('showThemeToggle', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggles = compiled.querySelectorAll('mat-slide-toggle');
    expect(toggles).toHaveLength(0);
  });
});
