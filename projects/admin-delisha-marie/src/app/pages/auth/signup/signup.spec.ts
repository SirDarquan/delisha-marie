import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi, Mock } from 'vitest';
import { SignUpComponent } from './signup';
import { AuthService } from '../../../services/auth.service';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { submit } from '@angular/forms/signals';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let router: Router;

  let signUpReturnValue = true;
  let signUpParams: unknown | null = null;
  const authStateSubject = new Subject<SocialUser>();

  let fakeSnackBar: { open: Mock };
  const fakeAuthService = {
    isUsernameAvailable: vi
      .fn()
      .mockImplementation(async (u: string) => Promise.resolve(u !== 'taken')),
    signUp: vi.fn().mockImplementation(async (user: unknown) => {
      signUpParams = user;
      return Promise.resolve(signUpReturnValue);
    }),
  };

  const fakeSocialAuthService = {
    authState: authStateSubject.asObservable(),
    initState: new Subject<boolean>().asObservable(),
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    signUpReturnValue = true;
    signUpParams = null;
    fakeSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: fakeAuthService },
        { provide: SocialAuthService, useValue: fakeSocialAuthService },
        { provide: MatSnackBar, useValue: fakeSnackBar },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: fakeSnackBar })
      .compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should create the signup component', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when form is empty', () => {
    expect(component['signUpForm']().valid()).toBeFalsy();
  });

  it('should succeed signup and navigate on valid form submission', async () => {
    vi.useFakeTimers();
    signUpReturnValue = true;
    component['signUpModel'].set({
      username: 'newuser',
      email: 'valid@example.com',
      password: 'ValidPassword123!',
    });
    fixture.detectChanges();
    await Promise.resolve();

    // Advance for debounceTime(500)
    vi.advanceTimersByTime(500);
    await Promise.resolve();

    await submit(component['signUpForm']);

    expect(signUpParams).toEqual({
      username: 'newuser',
      email: 'valid@example.com',
      password: 'ValidPassword123!',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not allow availability checking if username is short', async () => {
    vi.useFakeTimers();
    component['signUpModel'].set({ username: 'u', email: '', password: '' });
    fixture.detectChanges();
    await Promise.resolve();
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    fixture.detectChanges();
    expect(component['usernameAvailable']()).toBeNull();
  });

  it('should detect if username is already taken', async () => {
    component['signUpModel'].set({ username: 'taken', email: '', password: '' });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 600));
    fixture.detectChanges();
    expect(component['usernameAvailable']()).toBe(false);
  });

  it('should display error when registration fails', async () => {
    vi.useFakeTimers();
    signUpReturnValue = false;
    component['signUpModel'].set({
      username: 'newuser',
      email: 'valid@example.com',
      password: 'ValidPassword123!',
    });
    fixture.detectChanges();
    await Promise.resolve();
    vi.advanceTimersByTime(500);
    await Promise.resolve();

    await submit(component['signUpForm']);
    expect(fakeSnackBar.open).toHaveBeenCalledWith(
      'Registration failed. Please check your data and try again.',
      'Close',
      { duration: 10000 },
    );
  });

  it('should correctly derive password requirements via computed signals', () => {
    expect(component['isMinLength']()).toBe(false);
    expect(component['hasUppercase']()).toBe(false);
    expect(component['hasLowercase']()).toBe(false);
    expect(component['hasNumber']()).toBe(false);
    expect(component['hasSpecial']()).toBe(false);

    component['signUpModel'].set({ username: '', email: '', password: 'Valid123!' });
    fixture.detectChanges();
    expect(component['isMinLength']()).toBe(true);
    expect(component['hasUppercase']()).toBe(true);
    expect(component['hasLowercase']()).toBe(true);
    expect(component['hasNumber']()).toBe(true);
    expect(component['hasSpecial']()).toBe(true);
  });

  it('should handle social auth state changes', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com' } as SocialUser;
    authStateSubject.next(mockUser);
    expect(fakeSnackBar.open).toHaveBeenCalledWith(
      'Successfully authenticated as Test User! Redirecting...',
      'Close',
      { duration: 10000 },
    );

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
