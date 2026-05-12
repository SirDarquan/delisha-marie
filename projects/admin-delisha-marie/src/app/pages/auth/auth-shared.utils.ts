import { inject, signal, DestroyRef, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const BRAND_TITLE_TOKEN = new InjectionToken<string>('brandTitle');

export interface AuthCommonConfig {
  redirectUrl: string;
}

export function injectAuthCommon(config: AuthCommonConfig) {
  const router = inject(Router);
  const socialAuth = inject(SocialAuthService);
  const snackBar = inject(MatSnackBar);
  const destroyRef = inject(DestroyRef);

  const brandTitle = inject(BRAND_TITLE_TOKEN, { optional: true }) || 'Admin Portal';
  const hidePassword = signal<boolean>(true);

  // Centralized listener for shared social authentication lifecycle
  socialAuth.authState.pipe(takeUntilDestroyed(destroyRef)).subscribe((user: SocialUser | null) => {
    if (user) {
      snackBar.open(`Successfully authenticated as ${user.name}! Redirecting...`, 'Close', {
        duration: 10000,
      });
      router.navigate([config.redirectUrl]);
    }
  });

  return {
    brandTitle,
    hidePassword,
    togglePassword: () => hidePassword.update((v) => !v),
  };
}
