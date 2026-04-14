import { TestBed } from '@angular/core/testing';
import { Header } from './header';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeService } from '../../services/theme.service';
import { signal, WritableSignal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

describe('Header', () => {
  let themeServiceMock: {
    isDark: WritableSignal<boolean>;
    toggle: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    themeServiceMock = {
      isDark: signal(false),
      toggle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ThemeService, useValue: themeServiceMock }],
      imports: [Header, MatSlideToggleModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Header);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render branding', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('span')?.textContent).toContain('DELISHA');
  });

  it('should have navigation links', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(3); // About, Recipe, Contact
  });
});
