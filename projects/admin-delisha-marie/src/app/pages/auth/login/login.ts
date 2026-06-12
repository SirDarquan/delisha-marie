import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { email, form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { injectAuthCommon } from '../auth-shared.utils';

interface LoginStep1Model {
  email: string;
}

interface LoginStep2Model {
  code: string;
}

interface LoginStep3Model {
  firstName: string;
  lastName: string;
  displayName: string;
}

@Component({
  selector: 'app-login',
  imports: [
    FormRoot,
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <mat-card
        class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
        <div class="text-center mb-6">
          <h1
            class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {{ common.brandTitle }}
          </h1>
        </div>

        @if (exchangingOAuth()) {
          <div
            class="flex flex-col items-center justify-center py-10 gap-6 text-center animate-pulse">
            <mat-progress-bar mode="indeterminate" class="rounded-full max-w-xs" />
            <div>
              <h2 class="text-xl font-bold text-slate-100">Authenticating...</h2>
              <p class="text-slate-400 mt-2 text-sm">Finishing Google sign in, please wait.</p>
            </div>
          </div>
        } @else {
          @switch (currentStep()) {
            @case ('email') {
              <!-- Step 1: Email Form -->
              <form
                [formRoot]="step1Form"
                aria-label="Enter email form"
                class="flex flex-col gap-3">
                <div class="text-center mb-2">
                  <p class="text-slate-300 font-medium">Log in passwordlessly using Email OTP</p>
                </div>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email Address</mat-label>
                  <input
                    matInput
                    id="login-email"
                    type="email"
                    [formField]="step1Form.email"
                    placeholder="Enter your email address" />
                  @if (step1Form.email().touched() && step1Form.email().invalid()) {
                    <mat-error>Please enter a valid email address.</mat-error>
                  }
                </mat-form-field>

                <div class="flex flex-col gap-3 mt-2">
                  <button
                    mat-flat-button
                    color="primary"
                    class="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center"
                    type="submit"
                    [disabled]="submittingStep1()">
                    @if (submittingStep1()) {
                      <span>Sending Code...</span>
                    } @else {
                      <span>Log In</span>
                    }
                  </button>

                  @if (isDescopeAvailable()) {
                    <div class="flex items-center gap-2 my-2">
                      <div class="h-px flex-1 bg-slate-800"></div>
                      <span class="text-slate-500 text-xs uppercase tracking-widest font-semibold"
                        >OR</span
                      >
                      <div class="h-px flex-1 bg-slate-800"></div>
                    </div>

                    <button
                      mat-stroked-button
                      type="button"
                      id="descope-google-btn"
                      class="w-full h-14 text-lg font-bold rounded-xl border-slate-700 hover:bg-slate-800/50 !text-white shadow-lg shadow-black/10"
                      (click)="loginWithDescopeGoogle()">
                      <svg
                        class="w-6 h-6 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4" />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853" />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05" />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  }
                </div>
              </form>
            }

            @case ('otp') {
              <!-- Step 2: OTP Verification -->
              <form [formRoot]="step2Form" aria-label="Enter OTP form" class="flex flex-col gap-3">
                <div class="text-center mb-4">
                  <h2 class="text-xl font-bold text-slate-100">Verify Your Identity</h2>
                  <p class="text-slate-400 mt-1 text-sm">
                    We've sent a 6-digit code to
                    <span class="text-purple-400 font-semibold">{{ userEmail() }}</span>
                  </p>
                </div>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Verification Code</mat-label>
                  <input
                    matInput
                    id="login-otp"
                    type="text"
                    [formField]="step2Form.code"
                    placeholder="Enter 6-digit code"
                    class="text-center tracking-widest text-2xl font-mono"
                    autocomplete="one-time-code" />
                  @if (step2Form.code().touched() && step2Form.code().invalid()) {
                    <mat-error>Enter a valid 6-digit verification code.</mat-error>
                  }
                </mat-form-field>

                <div class="px-2">
                  <mat-progress-bar mode="indeterminate" class="my-2 rounded-full animate-pulse" />
                  <p class="text-slate-500 text-xs text-center">Checking code validity...</p>
                </div>

                <div class="flex flex-col gap-3 mt-4">
                  <button
                    mat-flat-button
                    color="primary"
                    class="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center"
                    type="submit"
                    [disabled]="step2Form().invalid() || submittingStep2()">
                    @if (submittingStep2()) {
                      <span>Verifying...</span>
                    } @else {
                      <span>Confirm Code</span>
                    }
                  </button>

                  <button
                    mat-stroked-button
                    type="button"
                    class="w-full h-14 text-slate-300 border-slate-700 hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-center"
                    [disabled]="submittingStep2()"
                    (click)="resendOtp()">
                    <span>Send a new code</span>
                  </button>

                  <button
                    mat-button
                    type="button"
                    class="w-full text-slate-400 hover:text-slate-300"
                    [disabled]="submittingStep2()"
                    (click)="goBackToEmail()">
                    ← Back to Email
                  </button>
                </div>
              </form>
            }

            @case ('info') {
              <!-- Step 3: Registration Profile Setup -->
              <form
                [formRoot]="step3Form"
                aria-label="Profile setup form"
                class="flex flex-col gap-3">
                <div class="text-center mb-4">
                  <h2 class="text-xl font-bold text-slate-100">Set Up Your Profile</h2>
                  <p class="text-slate-400 mt-1 text-sm">
                    Please tell us a bit about yourself to complete registration.
                  </p>
                </div>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email Address</mat-label>
                  <input
                    matInput
                    id="info-email"
                    type="text"
                    [value]="userEmail()"
                    readonly
                    disabled
                    class="text-slate-400 cursor-not-allowed" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>First Name</mat-label>
                  <input
                    matInput
                    id="info-firstName"
                    type="text"
                    [formField]="step3Form.firstName"
                    placeholder="Enter your first name" />
                  @if (step3Form.firstName().touched() && step3Form.firstName().invalid()) {
                    <mat-error>First name is required.</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Last Name</mat-label>
                  <input
                    matInput
                    id="info-lastName"
                    type="text"
                    [formField]="step3Form.lastName"
                    placeholder="Enter your last name" />
                  @if (step3Form.lastName().touched() && step3Form.lastName().invalid()) {
                    <mat-error>Last name is required.</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Display Name</mat-label>
                  <input
                    matInput
                    id="info-displayName"
                    type="text"
                    [formField]="step3Form.displayName"
                    placeholder="Choose a display name" />
                  @if (step3Form.displayName().touched() && step3Form.displayName().invalid()) {
                    <mat-error>Display name is required.</mat-error>
                  }
                </mat-form-field>

                <div class="flex flex-col gap-3 mt-4">
                  <button
                    mat-flat-button
                    color="primary"
                    class="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center"
                    type="submit"
                    [disabled]="step3Form().invalid() || submittingStep3()">
                    @if (submittingStep3()) {
                      <span>Completing Registration...</span>
                    } @else {
                      <span>Submit Profile</span>
                    }
                  </button>

                  <button
                    mat-button
                    type="button"
                    class="w-full text-slate-400 hover:text-slate-300"
                    [disabled]="submittingStep3()"
                    (click)="goBackFromProfile()">
                    {{ backButtonLabel() }}
                  </button>
                </div>
              </form>
            }
          }
        }
      </mat-card>
    </div>
  `,
  styles: `
    #descope-google-btn .mdc-button__label {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 12px !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  protected readonly common = injectAuthCommon();

  constructor() {
    const code = this.route.snapshot.queryParams['code'];
    if (code) {
      this.exchangingOAuth.set(true);
      this.isGoogleLogin.set(true);
    }
  }

  // State signals
  protected readonly isDescopeAvailable = computed(() => this.auth.isDescopeAvailable());
  protected readonly currentStep = signal<'email' | 'otp' | 'info'>('email');
  protected readonly isNewUser = signal<boolean>(false);
  protected readonly userEmail = signal<string>('');
  protected readonly otpCode = signal<string>('');
  protected readonly exchangingOAuth = signal<boolean>(false);
  protected readonly isGoogleLogin = signal<boolean>(false);
  protected readonly backButtonLabel = computed(() => {
    return this.isGoogleLogin() ? '← Back to Login' : '← Back to Verification Code';
  });
  protected readonly submittingStep1 = signal<boolean>(false);
  protected readonly submittingStep2 = signal<boolean>(false);
  protected readonly submittingStep3 = signal<boolean>(false);

  // Step 1: Email Form
  protected readonly step1Model = signal<LoginStep1Model>({ email: '' });
  protected readonly step1Form = form(
    this.step1Model,
    (s) => {
      required(s.email, { message: 'Email is required' });
      email(s.email, { message: 'Please enter a valid email address' });
    },
    {
      submission: {
        action: async (f) => {
          const { email: emailVal } = f().value();
          this.submittingStep1.set(true);
          this.isGoogleLogin.set(false);
          try {
            const resp = await this.auth.sendOtp(emailVal);
            if (resp.success) {
              this.isNewUser.set(resp.isNewUser);
              this.userEmail.set(emailVal);
              this.currentStep.set('otp');
              setTimeout(() => this.step2Form().focusBoundControl(), 0);
            } else {
              const errMsg = this.auth.authError() || 'Failed to send OTP. Please try again.';
              this.snackBar.open(errMsg, 'Close', { duration: 5000 });
            }
          } catch (err) {
            console.error('Error sending OTP:', err);
            this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 5000 });
          } finally {
            this.submittingStep1.set(false);
          }
        },
      },
    },
  );

  // Step 2: OTP verification
  protected readonly step2Model = signal<LoginStep2Model>({ code: '' });
  protected readonly step2Form = form(
    this.step2Model,
    (s) => {
      required(s.code, { message: 'Verification code is required' });
      pattern(s.code, /^\d{6}$/, { message: 'Code must be exactly 6 digits' });
    },
    {
      submission: {
        action: async (f) => {
          const { code: codeVal } = f().value();
          const emailVal = this.userEmail();
          this.submittingStep2.set(true);
          try {
            // Verify OTP immediately for both new and existing users
            const success = await this.auth.verifyOtp(emailVal, codeVal);
            if (success) {
              this.otpCode.set(codeVal);
              if (this.auth.isNewUserFlag()) {
                this.snackBar.open("Verification successful! Let's set up your profile.", 'Close', {
                  duration: 5000,
                });
                this.currentStep.set('info');
                setTimeout(() => this.step3Form().focusBoundControl(), 0);
              } else {
                this.snackBar.open('Successfully logged in!', 'Close', { duration: 5000 });
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                this.router.navigateByUrl(returnUrl);
              }
            } else {
              const errMsg =
                this.auth.authError() || 'Invalid verification code. Please try again.';
              this.snackBar.open(errMsg, 'Close', { duration: 5000 });
            }
          } catch (err) {
            console.error('Error verifying OTP:', err);
            this.snackBar.open('Verification failed. Please try again.', 'Close', {
              duration: 5000,
            });
          } finally {
            this.submittingStep2.set(false);
          }
        },
      },
    },
  );

  // Step 3: Registration Form (for new users)
  protected readonly step3Model = signal<LoginStep3Model>({
    firstName: '',
    lastName: '',
    displayName: '',
  });
  protected readonly step3Form = form(
    this.step3Model,
    (s) => {
      required(s.firstName, { message: 'First name is required' });
      required(s.lastName, { message: 'Last name is required' });
      required(s.displayName, { message: 'Display name is required' });
    },
    {
      submission: {
        action: async (f) => {
          const { firstName, lastName, displayName } = f().value();
          const emailVal = this.userEmail();
          const tokenVal = this.auth.descopeToken();
          this.submittingStep3.set(true);
          try {
            const success = await this.auth.registerDescope(
              emailVal,
              tokenVal,
              firstName,
              lastName,
              displayName,
            );
            if (success) {
              this.snackBar.open('Profile created and logged in successfully!', 'Close', {
                duration: 5000,
              });
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
              this.router.navigateByUrl(returnUrl);
            } else {
              const errMsg = this.auth.authError() || 'Registration failed. Please try again.';
              if (
                errMsg.toLowerCase().includes('otp') ||
                errMsg.toLowerCase().includes('code') ||
                errMsg.toLowerCase().includes('expire') ||
                errMsg.toLowerCase().includes('unauthorized') ||
                errMsg.toLowerCase().includes('token')
              ) {
                if (this.isGoogleLogin()) {
                  this.snackBar.open(
                    'Session has expired or is invalid. Redirecting to Google Login...',
                    'Close',
                    { duration: 7000 },
                  );
                  setTimeout(() => {
                    this.currentStep.set('email');
                  }, 1000);
                } else {
                  this.snackBar.open(
                    'Session has expired or is invalid. Redirecting to verify your OTP again...',
                    'Close',
                    { duration: 7000 },
                  );
                  this.step2Model.update((m) => ({ ...m, code: '' }));
                  setTimeout(() => {
                    this.currentStep.set('otp');
                  }, 1000);
                }
              } else {
                this.snackBar.open(errMsg, 'Close', { duration: 5000 });
              }
            }
          } catch (err) {
            console.error('Error during registration:', err);
            this.snackBar.open(
              'An error occurred during registration. Please try again.',
              'Close',
              { duration: 5000 },
            );
          } finally {
            this.submittingStep3.set(false);
          }
        },
      },
    },
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.auth.waitForSessionInit().then(async () => {
      if (this.auth.isAuthenticated()) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
        return;
      }

      // Check if there is an OAuth code query parameter
      const code = this.route.snapshot.queryParams['code'];
      if (code) {
        this.exchangingOAuth.set(true);
        this.isGoogleLogin.set(true);
        this.submittingStep1.set(true);
        this.snackBar.open('Finishing Google sign in...', 'Close', { duration: 3000 });
        try {
          const success = await this.auth.exchangeDescopeOAuthCode(code);
          if (success) {
            if (this.auth.isNewUserFlag()) {
              this.userEmail.set(this.auth.descopeEmail());
              this.snackBar.open("Successfully verified! Let's set up your profile.", 'Close', {
                duration: 5000,
              });
              this.currentStep.set('info');
              setTimeout(() => this.step3Form().focusBoundControl(), 0);
            } else {
              this.snackBar.open('Successfully logged in!', 'Close', { duration: 5000 });
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
              this.router.navigateByUrl(returnUrl);
            }
          } else {
            const errMsg = this.auth.authError() || 'Google sign in failed.';
            this.snackBar.open(errMsg, 'Close', { duration: 5000 });
            this.isGoogleLogin.set(false);
          }
        } catch (err) {
          console.error('Error exchanging OAuth code:', err);
          this.snackBar.open('An error occurred during Google sign in.', 'Close', {
            duration: 5000,
          });
          this.isGoogleLogin.set(false);
        } finally {
          this.submittingStep1.set(false);
          this.exchangingOAuth.set(false);
          // Clean up the URL query params so they don't persist
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { code: null, state: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.currentStep() === 'email') {
      this.step1Form().focusBoundControl();
    }
  }

  protected async loginWithDescopeGoogle() {
    this.isGoogleLogin.set(true);
    const redirectUrl = this.document.location.origin + '/login';
    const url = await this.auth.startDescopeGoogleOAuth(redirectUrl);
    if (url) {
      this.document.location.assign(url);
    } else {
      this.isGoogleLogin.set(false);
      this.snackBar.open('Failed to start Google sign in. Please try again.', 'Close', {
        duration: 5000,
      });
    }
  }

  protected async resendOtp() {
    const emailVal = this.userEmail();
    if (!emailVal) return;
    try {
      const resp = await this.auth.sendOtp(emailVal);
      if (resp.success) {
        this.otpCode.set('');
        this.step2Model.update((m) => ({ ...m, code: '' }));
        this.step2Form().focusBoundControl();
        this.snackBar.open(`A new OTP has been sent successfully to ${emailVal}`, 'Close', {
          duration: 5000,
        });
      } else {
        const errMsg = this.auth.authError() || 'Failed to send new OTP. Please try again.';
        this.snackBar.open(errMsg, 'Close', { duration: 5000 });
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      this.snackBar.open('Error sending new OTP.', 'Close', { duration: 5000 });
    }
  }

  protected goBackFromProfile() {
    if (this.isGoogleLogin()) {
      this.currentStep.set('email');
    } else {
      this.currentStep.set('otp');
    }
  }

  protected goBackToEmail() {
    this.currentStep.set('email');
    this.step1Form().focusBoundControl();
  }
}
