import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForSessionInit();

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Handle waiting room / pending status
  if (auth.userStatus() === 'pending') {
    if (state.url.includes('/pending-approval')) {
      return true;
    }
    return router.createUrlTree(['/pending-approval']);
  }

  // If active user visits /pending-approval, redirect to home
  if (state.url.includes('/pending-approval')) {
    return router.createUrlTree(['/']);
  }

  // Protect admin-only route (/users) from members
  if (state.url.includes('/users') && !auth.isAdmin()) {
    return router.createUrlTree(['/']);
  }

  // Admins cannot directly edit member recipes without impersonating
  if (
    (state.url.includes('/recipes') ||
      state.url.includes('/pages') ||
      state.url.includes('/contacts')) &&
    auth.isAdmin() &&
    !auth.isImpersonating()
  ) {
    return router.createUrlTree(['/users']);
  }

  return true;
};
