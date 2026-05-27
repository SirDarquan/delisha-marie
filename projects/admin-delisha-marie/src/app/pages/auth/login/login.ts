import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation,
  OnInit,
  signal,
  AfterViewInit,
} from '@angular/core';
import { form, FormRoot, FormField, required, email, pattern } from '@angular/forms/signals';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../services/auth.service';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
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
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    GoogleSigninButtonModule,
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

        <!-- Step 1: Email Form (hidden when not on email step to prevent browser autofill/overlay destroy crashes) -->
        <div [class.hidden]="currentStep() !== 'email'">
          <form [formRoot]="step1Form" aria-label="Enter email form" class="flex flex-col gap-3">
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
                class="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20"
                type="submit"
                [disabled]="submittingStep1()">
                @if (submittingStep1()) {
                  Sending Code...
                } @else {
                  Log In
                }
              </button>

              <div class="flex items-center gap-2 my-2">
                <div class="h-px flex-1 bg-slate-800"></div>
                <span class="text-slate-500 text-xs uppercase tracking-widest font-semibold"
                  >OR</span
                >
                <div class="h-px flex-1 bg-slate-800"></div>
              </div>

              <div class="flex justify-center w-full">
                <asl-google-signin-button
                  type="standard"
                  size="large"
                  logo_alignment="center"
                  locale="en"></asl-google-signin-button>
              </div>

              <button
                mat-stroked-button
                type="button"
                class="w-full py-6 text-slate-300 border-slate-700 hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-center gap-2"
                (click)="authenticateWithPasskey()">
                <span class="material-icons text-xl">fingerprint</span>
                Sign in with Passkey
              </button>
            </div>

            <div class="mt-6 flex flex-col gap-3 text-center">
              <div class="flex justify-between text-sm">
                <button
                  type="button"
                  class="text-purple-400 hover:text-purple-300 transition-colors"
                  (click)="onForgotUsername()">
                  Forgot Username?
                </button>
                <button
                  type="button"
                  class="text-purple-400 hover:text-purple-300 transition-colors"
                  (click)="onForgotPassword()">
                  Forgot Password?
                </button>
              </div>
              <p class="text-slate-400 text-sm">
                Don't have an account?
                <a
                  routerLink="/signup"
                  class="text-pink-500 hover:text-pink-400 font-semibold transition-colors underline-offset-4 hover:underline">
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Step 2: OTP Verification (hidden when not on OTP step) -->
        <div [class.hidden]="currentStep() !== 'otp'">
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
                class="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20"
                type="submit"
                [disabled]="step2Form().invalid() || submittingStep2()">
                @if (submittingStep2()) {
                  Verifying...
                } @else {
                  Confirm Code
                }
              </button>

              <button
                mat-stroked-button
                type="button"
                class="w-full py-6 text-slate-300 border-slate-700 hover:bg-slate-800/50 rounded-xl transition-all"
                [disabled]="submittingStep2()"
                (click)="resendOtp()">
                Send a new code
              </button>

              <button
                mat-button
                type="button"
                class="w-full text-slate-400 hover:text-slate-300"
                [disabled]="submittingStep2()"
                (click)="currentStep.set('email')">
                ← Back to Email
              </button>
            </div>
          </form>
        </div>

        <!-- Step 3: Registration Profile Setup (hidden when not on Info step) -->
        <div [class.hidden]="currentStep() !== 'info'">
          <form [formRoot]="step3Form" aria-label="Profile setup form" class="flex flex-col gap-3">
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
                class="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20"
                type="submit"
                [disabled]="step3Form().invalid() || submittingStep3()">
                @if (submittingStep3()) {
                  Completing Registration...
                } @else {
                  Submit Profile
                }
              </button>

              <button
                mat-button
                type="button"
                class="w-full text-slate-400 hover:text-slate-300"
                [disabled]="submittingStep3()"
                (click)="currentStep.set('otp')">
                ← Back to Verification Code
              </button>
            </div>
          </form>
        </div>
      </mat-card>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly common = injectAuthCommon({ redirectUrl: '/' });

  // State signals
  protected readonly currentStep = signal<'email' | 'otp' | 'info'>('email');
  protected readonly isNewUser = signal<boolean>(false);
  protected readonly userEmail = signal<string>('');
  protected readonly otpCode = signal<string>('');
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
                this.snackBar.open(
                  'Session has expired or is invalid. Redirecting to verify your OTP again...',
                  'Close',
                  { duration: 7000 },
                );
                this.step2Model.update((m) => ({ ...m, code: '' }));
                setTimeout(() => {
                  this.currentStep.set('otp');
                }, 1000);
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
    this.auth.waitForSessionInit().then(() => {
      if (this.auth.isAuthenticated()) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  ngAfterViewInit(): void {
    this.step1Form().focusBoundControl();
  }

  protected async resendOtp() {
    const emailVal = this.userEmail();
    if (!emailVal) return;
    try {
      const resp = await this.auth.sendOtp(emailVal);
      if (resp.success) {
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

  protected async onForgotUsername() {
    const emailVal = prompt('Please enter your email:');
    if (emailVal) {
      const user = await this.auth.retrieveUsername(emailVal);
      if (user) {
        this.snackBar.open(`Your username is: ${user}`, 'Close', { duration: 10000 });
      } else {
        this.snackBar.open('Email address not found.', 'Close', { duration: 10000 });
      }
    }
  }

  protected async onForgotPassword() {
    const username = prompt('Please enter your username:');
    if (username) {
      const pw = await this.auth.retrievePassword(username);
      if (pw) {
        this.snackBar.open(`Your password is: ${pw}`, 'Close', { duration: 10000 });
      } else {
        this.snackBar.open('Username not found.', 'Close', { duration: 10000 });
      }
    }
  }

  protected async authenticateWithPasskey() {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4]),
          allowCredentials: [],
          userVerification: 'required',
        },
      });

      if (credential) {
        await this.auth.checkSession();
        this.snackBar.open('Passkey authenticated successfully! Logging you in...', 'Close', {
          duration: 10000,
        });
        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }, 1000);
      }
    } catch {
      this.snackBar.open('Passkey authentication failed or was cancelled.', 'Close', {
        duration: 10000,
      });
    }
  }
}
