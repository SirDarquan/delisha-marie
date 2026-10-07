import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Mock, vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from './header';

interface MockAuthService {
  currentUser: unknown;
  isAdmin: unknown;
  isImpersonating: unknown;
  tenant: unknown;
  logout: Mock;
  exitImpersonation: Mock;
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  let fakeAuthService: MockAuthService;
  const fakeCurrentUser = signal<unknown>(null);
  const fakeIsAdmin = signal<boolean>(false);
  const fakeIsImpersonating = signal<boolean>(false);
  const fakeTenant = signal<unknown>(null);

  beforeEach(async () => {
    fakeCurrentUser.set(null);
    fakeIsAdmin.set(false);
    fakeIsImpersonating.set(false);
    fakeTenant.set(null);

    fakeAuthService = {
      currentUser: fakeCurrentUser,
      isAdmin: fakeIsAdmin,
      isImpersonating: fakeIsImpersonating,
      tenant: fakeTenant,
      logout: vi.fn(),
      exitImpersonation: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  it('should default user welcome text to Admin when no user is logged in', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeText = compiled
      .querySelector('span.text-slate-400')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
    expect(welcomeText).toBe('Welcome back, Admin !');
  });

  it('should display the username when a user is logged in', () => {
    fakeCurrentUser.set({
      username: 'sirda',
      email: 'sirda@example.com',
      user_metadata: { username: 'SirDarquan' },
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeText = compiled
      .querySelector('span.text-slate-400')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
    expect(welcomeText).toBe('Welcome back, SirDarquan !');
  });

  it('should display email when user_metadata has no username', () => {
    fakeCurrentUser.set({
      username: 'sirda',
      email: 'sirda@example.com',
      user_metadata: null,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeText = compiled
      .querySelector('span.text-slate-400')
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
    expect(welcomeText).toBe('Welcome back, sirda@example.com !');
  });

  it('should render Admin navigation links when isAdmin is true', () => {
    fakeIsAdmin.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navText = compiled.querySelector('nav')?.textContent;
    expect(navText).toContain('Users & Tenants');
    expect(navText).not.toContain('Recipes');
  });

  it('should render Member navigation links when isAdmin is false', () => {
    fakeIsAdmin.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navText = compiled.querySelector('nav')?.textContent;
    expect(navText).toContain('Recipes');
    expect(navText).toContain('Contacts');
    expect(navText).toContain('Other Pages');
    expect(navText).not.toContain('Users & Tenants');
  });

  it('should switch to Member navigation links when an Admin is impersonating', () => {
    fakeIsAdmin.set(true);
    fakeIsImpersonating.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navText = compiled.querySelector('nav')?.textContent;
    expect(navText).toContain('Recipes');
    expect(navText).toContain('Contacts');
    expect(navText).toContain('Other Pages');
    expect(navText).not.toContain('Users & Tenants');
  });

  it('should apply top-[41px] class to header when isImpersonating is true', () => {
    fakeIsImpersonating.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerEl = compiled.querySelector('header');
    expect(headerEl?.classList.contains('top-[41px]')).toBe(true);

    fakeIsImpersonating.set(false);
    fixture.detectChanges();
    expect(headerEl?.classList.contains('top-[41px]')).toBe(false);
  });

  it('should trigger logout and navigate to login page on onLogout()', () => {
    component.onLogout();
    expect(fakeAuthService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
