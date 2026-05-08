import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import {
  form,
  FormRoot,
  FormField,
  required,
  email,
  minLength,
  pattern,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { BRAND_TITLE_TOKEN } from '../login/login';
import {
  SocialAuthService,
  GoogleSigninButtonModule,
  SocialUser,
} from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs';

interface SignUpModel {
  username: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-signup',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    GoogleSigninButtonModule,
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <mat-card
        class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
        <div class="text-center mb-6">
          <h1
            class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {{ brandTitle }}
          </h1>
          <p class="text-slate-400 mt-1 font-medium text-sm">Create New Account</p>
        </div>

        <form [formRoot]="signUpForm" aria-label="Sign up form" class="flex flex-col gap-3">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Username</mat-label>
            <input
              matInput
              id="reg-username"
              type="text"
              [formField]="signUpForm.username"
              placeholder="e.g., sirdarquan"
              autocomplete="username" />
            @if (signUpForm.username().touched() && signUpForm.username().invalid()) {
              <mat-error>Username is required (min 3 chars).</mat-error>
            }
            @if (usernameAvailable() && signUpForm.username().valid()) {
              <mat-hint class="text-green-400 font-medium">✓ Username is available!</mat-hint>
            } @else if (usernameAvailable() === false && signUpForm.username().valid()) {
              <mat-hint class="text-red-400 font-medium">✗ Username is already taken.</mat-hint>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mt-2">
            <mat-label>Email Address</mat-label>
            <input
              matInput
              id="reg-email"
              type="email"
              [formField]="signUpForm.email"
              placeholder="e.g., test@example.com"
              autocomplete="email" />
            @if (signUpForm.email().touched() && signUpForm.email().invalid()) {
              <mat-error>Please enter a valid email address.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full mt-2">
            <mat-label>Password</mat-label>
            <input
              matInput
              id="reg-password"
              [type]="hidePassword() ? 'password' : 'text'"
              [formField]="signUpForm.password"
              placeholder="Secure password"
              autocomplete="new-password" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword.set(!hidePassword())"
              [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
              [attr.aria-pressed]="!hidePassword()"
              style="background: transparent; border: none; color: rgb(148, 163, 184); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
              <span class="material-icons">{{
                hidePassword() ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
            @if (signUpForm.password().touched() && signUpForm.password().invalid()) {
              <mat-error>Password does not meet requirements.</mat-error>
            }
          </mat-form-field>

          <div
            class="grid grid-cols-2 gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-xl mb-2">
            <p
              [class.text-green-400]="isMinLength()"
              class="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <span>{{ isMinLength() ? '✓' : '•' }}</span> At least 8 chars
            </p>
            <p
              [class.text-green-400]="hasUppercase()"
              class="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <span>{{ hasUppercase() ? '✓' : '•' }}</span> One uppercase
            </p>
            <p
              [class.text-green-400]="hasLowercase()"
              class="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <span>{{ hasLowercase() ? '✓' : '•' }}</span> One lowercase
            </p>
            <p
              [class.text-green-400]="hasNumber()"
              class="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <span>{{ hasNumber() ? '✓' : '•' }}</span> One number
            </p>
            <p
              [class.text-green-400]="hasSpecial()"
              class="text-[11px] text-slate-500 font-semibold flex items-center gap-1 col-span-2">
              <span>{{ hasSpecial() ? '✓' : '•' }}</span> One special character (&#64;, $, !, %, *,
              ?, &)
            </p>
          </div>

          <div class="flex flex-col gap-3 mt-2">
            <button
              mat-flat-button
              type="submit"
              [disabled]="
                signUpForm().invalid() ||
                usernameAvailable() === false ||
                emailAvailable() === false ||
                signUpForm().submitting()
              "
              class="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/20 transition cursor-pointer">
              @if (signUpForm().submitting()) {
                Creating Account...
              } @else {
                Create Account
              }
            </button>

            <div class="flex items-center gap-2 my-2">
              <div class="h-px flex-1 bg-slate-800"></div>
              <span class="text-slate-500 text-xs uppercase tracking-widest font-semibold">OR</span>
              <div class="h-px flex-1 bg-slate-800"></div>
            </div>

            <div class="flex justify-center w-full">
              <asl-google-signin-button
                type="standard"
                size="large"
                [width]="400"
                shape="circle"
                data-use_fedcm_for_prompt="true"></asl-google-signin-button>
            </div>
          </div>

          <div class="mt-6 text-center">
            <p class="text-slate-400 text-sm">
              Already have an account?
              <a
                routerLink="/login"
                class="text-pink-500 hover:text-pink-400 font-semibold transition-colors underline-offset-4 hover:underline">
                Log In
              </a>
            </p>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [
    `
      asl-google-signin-button .nsm7Bb-HzV7m-LgbsSe {
        background-color: var(--mat-sys-background) !important;
        border: 1px solid var(--mat-sys-on-background) !important;
        color: var(--mat-sys-on-surface) !important;
        border-radius: 50%;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly socialAuth = inject(SocialAuthService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly brandTitle = inject(BRAND_TITLE_TOKEN, { optional: true }) || 'Admin Portal';

  protected readonly signUpModel = signal<SignUpModel>({ username: '', email: '', password: '' });
  protected readonly signUpForm = form(
    this.signUpModel,
    (s) => {
      required(s.username, { message: 'Username is required' });
      minLength(s.username, 3, { message: 'Username is required (min 3 chars)' });
      required(s.email, { message: 'Email address is required' });
      email(s.email, { message: 'Please enter a valid email address' });
      required(s.password, { message: 'Password is required' });
      minLength(s.password, 8, { message: 'Password must be at least 8 characters' });
      pattern(s.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
        message: 'Password does not meet requirements.',
      });
    },
    {
      submission: {
        action: async (f) => {
          const v = f().value();
          const success = await this.auth.signUp({
            username: v.username,
            email: v.email,
            password: v.password,
          });

          if (success) {
            this.snackBar.open(
              'Account successfully created! Redirecting to Recipe page...',
              'Close',
              {
                duration: 5000,
              },
            );
            this.router.navigate(['/recipes']);
          } else {
            this.snackBar.open(
              'Registration failed. Please check your data and try again.',
              'Close',
              {
                duration: 10000,
              },
            );
          }
        },
      },
    },
  );

  private authSubscription?: Subscription;
  protected readonly usernameChecking = toObservable(this.signUpForm.username().value);
  protected readonly usernameAvailable = toSignal(
    this.usernameChecking.pipe(
      debounceTime(500),
      switchMap((val) => {
        if (!val || val.length < 3) {
          return Promise.resolve(null);
        }
        return this.auth.isUsernameAvailable(val);
      }),
    ),
    { initialValue: null as boolean | null },
  );

  protected readonly hidePassword = signal<boolean>(true);
  protected readonly emailAvailable = signal<boolean | null>(null);

  protected isMinLength = computed(() => (this.signUpForm.password().value() || '').length >= 8);
  protected hasUppercase = computed(() => /[A-Z]/.test(this.signUpForm.password().value() || ''));
  protected hasLowercase = computed(() => /[a-z]/.test(this.signUpForm.password().value() || ''));
  protected hasNumber = computed(() => /\d/.test(this.signUpForm.password().value() || ''));
  protected hasSpecial = computed(() => /[@$!%*?&]/.test(this.signUpForm.password().value() || ''));

  ngOnInit(): void {
    this.authSubscription = this.socialAuth.authState.subscribe((user: SocialUser) => {
      if (user) {
        this.handleSocialUser(user);
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private handleSocialUser(user: SocialUser): void {
    if (user) {
      this.snackBar.open(`Successfully signed up/in as ${user.name}! Redirecting...`, 'Close', {
        duration: 10000,
      });
      setTimeout(() => {
        this.router.navigate(['/recipes']);
      }, 1000);
    }
  }
}
