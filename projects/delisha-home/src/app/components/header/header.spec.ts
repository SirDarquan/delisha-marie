import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: MatSnackBar, useValue: mockSnackBar }],
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

  it('should render navigation links for About and Contact, and disabled button for Kitchen', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a');
    expect(navLinks).toHaveLength(2);

    // About link
    expect(navLinks[0].textContent).toContain('About');
    expect(navLinks[0].getAttribute('href')).toBe('/about');

    // Contact link
    expect(navLinks[1].textContent).toContain('Contact');
    expect(navLinks[1].getAttribute('href')).toBe('/contact');

    // Kitchen button
    const kitchenBtn = compiled.querySelector('nav button');
    expect(kitchenBtn).toBeTruthy();
    expect(kitchenBtn?.textContent).toContain('Kitchen');
    expect(kitchenBtn?.getAttribute('aria-label')).toContain('Coming soon');
  });

  it('should show "Coming soon" snackbar when Kitchen button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const kitchenBtn = compiled.querySelector('nav button') as HTMLButtonElement;
    expect(kitchenBtn).toBeTruthy();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    kitchenBtn.dispatchEvent(event);

    expect(mockSnackBar.open).toHaveBeenCalledWith('Coming soon', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  });
});
