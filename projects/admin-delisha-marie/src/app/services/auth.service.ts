import { Injectable, signal, computed, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';

export interface AdminUser {
  username: string;
  email: string;
  password?: string;
  user_metadata?: {
    username?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly socialAuth = inject(SocialAuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<AdminUser | null>(null);

  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentUser());

  private readonly authSubscription: Subscription;
  private sessionInitPromise: Promise<void> | null = null;

  constructor() {
    this.authSubscription = this.socialAuth.authState.subscribe(async (user: SocialUser) => {
      if (user) {
        await this.loginWithSocial(user);
      }
    });
  }

  waitForSessionInit(): Promise<void> {
    if (!this.sessionInitPromise) {
      if (isPlatformBrowser(this.platformId)) {
        this.sessionInitPromise = this.checkSession();
      } else {
        this.sessionInitPromise = Promise.resolve();
      }
    }
    return this.sessionInitPromise;
  }

  async checkSession(): Promise<void> {
    try {
      const resp = await this.api.get<{ user: AdminUser }>(`/auth/me?t=${Date.now()}`);
      if (resp?.user) {
        this.setSession(resp.user);
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const cleanUser = username.trim();
    if (!cleanUser) return false;
    try {
      const resp = await this.api.get<{ available: boolean }>(`/auth/check-username`, {
        params: { username: cleanUser },
      });
      return resp.available;
    } catch (err) {
      console.error('Error checking username availability:', err);
      return false;
    }
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const cleanEmail = email.trim();
    if (!cleanEmail) return false;
    try {
      const resp = await this.api.get<{ available: boolean }>(`/auth/check-email`, {
        params: { email: cleanEmail },
      });
      return resp.available;
    } catch (err) {
      console.error('Error checking email availability:', err);
      return false;
    }
  }

  async signUp(user: AdminUser): Promise<boolean> {
    try {
      const resp = await this.api.post<{
        success?: boolean;
        session?: { access_token: string };
        user?: AdminUser;
      }>('/auth/signup', {
        email: user.email.trim(),
        password: user.password,
        username: user.username.trim(),
      });
      if (resp.session?.access_token && resp.user) {
        this.setSession(resp.user);
      }
      return true;
    } catch (err) {
      console.error('Backend signUp error:', err);
      return false;
    }
  }

  async login(username: string, pinOrPassword: string): Promise<boolean> {
    try {
      const resp = await this.api.post<{ session?: { access_token: string }; user?: AdminUser }>(
        '/auth/login',
        {
          username: username.trim(),
          password: pinOrPassword,
        },
      );

      if (resp.session?.access_token && resp.user) {
        this.setSession(resp.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Backend login error:', err);
      return false;
    }
  }

  async loginWithSocial(socialUser: SocialUser): Promise<boolean> {
    try {
      // Real app implementation: verify the token on the backend
      console.log(socialUser);
      const resp = await this.api.post<{
        success: boolean;
        session?: { access_token: string };
        user?: AdminUser;
      }>('/auth/social-login', {
        token: socialUser.idToken,
        provider: socialUser.provider?.toLowerCase(),
      });

      if (resp.success && resp.session?.access_token && resp.user) {
        this.setSession(resp.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Social login error:', err);
      return false;
    }
  }

  private setSession(user: AdminUser): void {
    this._isAuthenticated.set(true);
    this._currentUser.set(user);
  }

  async retrievePassword(usernameOrEmail: string): Promise<string | null> {
    try {
      const resp = await this.api.post<{ password: string | null }>('/auth/retrieve-password', {
        identifier: usernameOrEmail.trim(),
      });
      return resp.password;
    } catch (err) {
      console.error('Error retrieving password:', err);
      return null;
    }
  }

  async retrieveUsername(email: string): Promise<string | null> {
    try {
      const resp = await this.api.post<{ username: string | null }>('/auth/retrieve-username', {
        email: email.trim(),
      });
      return resp.username;
    } catch (err) {
      console.error('Error retrieving username:', err);
      return null;
    }
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.api.post('/auth/signout', {}).catch(() => {
      /* ignore */
    });
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.socialAuth.signOut().catch(() => {
      /* ignore */
    });
  }
}
