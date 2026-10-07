import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { ImpersonationBannerComponent } from './impersonation-banner';

interface MockAuthService {
  currentUser: unknown;
  isImpersonating: unknown;
  tenant: unknown;
  exitImpersonation: Mock;
}

describe('ImpersonationBannerComponent', () => {
  let component: ImpersonationBannerComponent;
  let fixture: ComponentFixture<ImpersonationBannerComponent>;
  let router: Router;

  let fakeAuthService: MockAuthService;
  const fakeCurrentUser = signal<unknown>(null);
  const fakeIsImpersonating = signal<boolean>(false);
  const fakeTenant = signal<unknown>(null);

  beforeEach(async () => {
    fakeCurrentUser.set(null);
    fakeIsImpersonating.set(false);
    fakeTenant.set(null);

    fakeAuthService = {
      currentUser: fakeCurrentUser,
      isImpersonating: fakeIsImpersonating,
      tenant: fakeTenant,
      exitImpersonation: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ImpersonationBannerComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpersonationBannerComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not render anything when isImpersonating is false', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('article')).toBeNull();
  });

  it('should render the impersonation banner when isImpersonating is true', () => {
    fakeIsImpersonating.set(true);
    fakeCurrentUser.set({ email: 'sirdarquan+dm@gmail.com' });
    fakeTenant.set({ name: 'Sir Darquan DM Tenant' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('article');
    expect(banner).toBeTruthy();
    expect(banner?.classList.contains('sticky')).toBe(true);
    expect(banner?.classList.contains('top-0')).toBe(true);
    expect(banner?.textContent).toContain('sirdarquan+dm@gmail.com');
    expect(banner?.textContent).toContain('Sir Darquan DM Tenant');
    expect(banner?.textContent).toContain('Return to Admin');
  });

  it('should call exitImpersonation and navigate to /users on button click', async () => {
    fakeIsImpersonating.set(true);
    fakeCurrentUser.set({ email: 'sirdarquan+dm@gmail.com' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await component.onExitImpersonation();
    expect(fakeAuthService.exitImpersonation).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });
});
