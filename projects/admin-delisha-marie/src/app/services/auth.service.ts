import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, Injector, PLATFORM_ID, signal } from '@angular/core';
import { DescopeAuthConfig, DescopeAuthService } from '@descope/angular-sdk';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

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
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  private _descopeConfig: DescopeAuthConfig | null = null;
  private _descopeAuth: DescopeAuthService | null = null;

  private get descopeConfig(): DescopeAuthConfig | null {
    this._descopeConfig ??= this.injector.get(DescopeAuthConfig, null);
    return this._descopeConfig;
  }

  private get descopeAuth(): DescopeAuthService | null {
    this._descopeAuth ??= this.injector.get(DescopeAuthService, null);
    return this._descopeAuth;
  }

  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<AdminUser | null>(null);
  private readonly _authError = signal<string | null>(null);
  private readonly _descopeToken = signal<string>('');
  private readonly _descopeEmail = signal<string>('');
  private readonly _isNewUserFlag = signal<boolean>(false);

  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentUser());
  readonly authError = computed(() => this._authError());
  readonly descopeToken = computed(() => this._descopeToken());
  readonly descopeEmail = computed(() => this._descopeEmail());
  readonly isNewUserFlag = computed(() => this._isNewUserFlag());
  readonly isDescopeAvailable = computed(() => !!this.descopeConfig?.projectId);

  private sessionInitPromise: Promise<void> | null = null;

  waitForSessionInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    this.sessionInitPromise ??= this.checkSession();
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

  async startDescopeGoogleOAuth(redirectUrl: string): Promise<string | null> {
    if (!this.descopeAuth) return null;
    try {
      const resp = await firstValueFrom(
        this.descopeAuth.descopeSdk.oauth.start('google', redirectUrl),
      );
      if (resp.ok && resp.data) {
        const data = resp.data as Record<string, unknown>;
        if (data['url']) {
          return data['url'] as string;
        }
      }
      return null;
    } catch (err) {
      console.error('Error starting Descope Google OAuth:', err);
      return null;
    }
  }

  async exchangeDescopeOAuthCode(code: string): Promise<boolean> {
    this._authError.set(null);
    this._descopeToken.set('');
    this._descopeEmail.set('');
    this._isNewUserFlag.set(false);
    if (!this.descopeAuth) return false;

    try {
      const exchangeResp = await firstValueFrom(this.descopeAuth.descopeSdk.oauth.exchange(code));
      if (!exchangeResp.ok || !exchangeResp.data) {
        this._authError.set(
          exchangeResp.error?.errorDescription || 'Failed to exchange OAuth code.',
        );
        return false;
      }

      const email = exchangeResp.data.user?.email || '';
      const descopeToken = exchangeResp.data.sessionJwt || '';

      if (!email) {
        this._authError.set('No email address returned from Google account.');
        return false;
      }

      const resp = await this.api.post<{
        success: boolean;
        isNewUser?: boolean;
        descopeToken?: string;
        session?: { access_token: string };
        user?: AdminUser;
      }>('/auth/descope/verify-oauth', {
        email,
        descopeToken,
      });

      if (this.handleAuthResponse(email, resp)) {
        return true;
      }

      this._authError.set('OAuth verification with backend failed.');
      return false;
    } catch (err) {
      console.error('OAuth exchange error:', err);
      const errMsg =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error?: { error?: string } }).error?.error || 'OAuth verification failed'
          : 'OAuth verification failed';
      this._authError.set(errMsg);
      return false;
    }
  }

  async sendOtp(email: string): Promise<{ success: boolean; isNewUser: boolean }> {
    this._authError.set(null);
    try {
      const resp = await this.api.post<{ success: boolean; isNewUser: boolean }>(
        '/auth/descope/send-otp',
        {
          email: email.trim(),
        },
      );
      return { success: !!resp.success, isNewUser: !!resp.isNewUser };
    } catch (err) {
      console.error('Send OTP error:', err);
      const errMsg =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error?: { error?: string } }).error?.error || 'Failed to send OTP'
          : 'Failed to send OTP';
      this._authError.set(errMsg);
      return { success: false, isNewUser: false };
    }
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    this._authError.set(null);
    this._descopeToken.set('');
    this._isNewUserFlag.set(false);
    try {
      const resp = await this.api.post<{
        success: boolean;
        isNewUser?: boolean;
        descopeToken?: string;
        session?: { access_token: string };
        user?: AdminUser;
      }>('/auth/descope/verify-otp', {
        email: email.trim(),
        code: code.trim(),
      });
      if (this.handleAuthResponse(email, resp)) {
        return true;
      }
      this._authError.set('Invalid verification code.');
      return false;
    } catch (err) {
      console.error('Verify OTP error:', err);
      const errMsg =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error?: { error?: string } }).error?.error || 'Verification failed'
          : 'Verification failed';
      this._authError.set(errMsg);
      return false;
    }
  }

  async registerDescope(
    email: string,
    descopeToken: string,
    firstName: string,
    lastName: string,
    displayName: string,
  ): Promise<boolean> {
    this._authError.set(null);
    try {
      const resp = await this.api.post<{
        success: boolean;
        session?: { access_token: string };
        user?: AdminUser;
      }>('/auth/descope/register', {
        email: email.trim(),
        descopeToken: descopeToken.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
      });
      if (resp.success && resp.session?.access_token && resp.user) {
        this.setSession(resp.user);
        return true;
      }
      this._authError.set('Registration failed.');
      return false;
    } catch (err) {
      console.error('Register Descope error:', err);
      const errMsg =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error?: { error?: string } }).error?.error || 'Registration failed'
          : 'Registration failed';
      this._authError.set(errMsg);
      return false;
    }
  }

  private handleAuthResponse(
    email: string,
    resp: {
      success: boolean;
      isNewUser?: boolean;
      descopeToken?: string;
      session?: { access_token: string };
      user?: AdminUser;
    },
  ): boolean {
    if (resp.success) {
      if (resp.isNewUser) {
        this._descopeToken.set(resp.descopeToken || '');
        this._descopeEmail.set(email);
        this._isNewUserFlag.set(true);
        return true;
      } else if (resp.session?.access_token && resp.user) {
        this._isNewUserFlag.set(false);
        this.setSession(resp.user);
        return true;
      }
    }
    return false;
  }

  private setSession(user: AdminUser): void {
    this._isAuthenticated.set(true);
    this._currentUser.set(user);
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
  }
}
