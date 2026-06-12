import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Mock, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from './header';

interface MockAuthService {
  currentUser: unknown;
  logout: Mock;
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  let fakeAuthService: MockAuthService;
  const fakeCurrentUser = signal<unknown>(null);

  beforeEach(async () => {
    fakeCurrentUser.set(null);

    fakeAuthService = {
      currentUser: fakeCurrentUser,
      logout: vi.fn(),
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

  it('should trigger logout and navigate to login page on onLogout()', () => {
    component.onLogout();
    expect(fakeAuthService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display blank/undefined username if user_metadata is missing', () => {
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
    expect(welcomeText).toBe('Welcome back, !');
  });
});
