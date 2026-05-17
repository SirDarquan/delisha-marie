import { inject, signal, DestroyRef, InjectionToken } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const BRAND_TITLE_TOKEN = new InjectionToken<string>('brandTitle');

export interface AuthCommonConfig {
  redirectUrl: string;
}

export function injectAuthCommon(config: AuthCommonConfig) {
  const router = inject(Router);
  const route = inject(ActivatedRoute, { optional: true });
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
      const returnUrl = route?.snapshot.queryParams['returnUrl'] || config.redirectUrl;
      router.navigateByUrl(returnUrl);
    }
  });

  return {
    brandTitle,
    hidePassword,
    togglePassword: () => hidePassword.update((v) => !v),
  };
}
