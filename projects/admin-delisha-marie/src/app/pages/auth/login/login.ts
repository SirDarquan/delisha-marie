import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation,
  OnInit,
  signal,
} from '@angular/core';
import { form, FormRoot, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { injectAuthCommon } from '../auth-shared.utils';

interface LoginModel {
  username: string;
  password: string;
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

        <form [formRoot]="loginForm" aria-label="Log in form" class="flex flex-col gap-3">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Username</mat-label>
            <input
              matInput
              id="login-username"
              type="text"
              [formField]="loginForm.username"
              placeholder="Enter your username" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input
              matInput
              id="login-password"
              [type]="common.hidePassword() ? 'password' : 'text'"
              [formField]="loginForm.password"
              placeholder="Enter your password" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="common.togglePassword()"
              [attr.aria-label]="common.hidePassword() ? 'Show password' : 'Hide password'"
              [attr.aria-pressed]="!common.hidePassword()"
              style="background: transparent; border: none; color: rgb(148, 163, 184); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
              <span class="material-icons">{{
                common.hidePassword() ? 'visibility_off' : 'visibility'
              }}</span>
            </button>
          </mat-form-field>

          <div class="flex flex-col gap-3 mt-2">
            <button
              mat-flat-button
              color="primary"
              class="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/20"
              type="submit"
              [disabled]="loginForm().submitting()">
              @if (loginForm().submitting()) {
                Logging in...
              } @else {
                Log In
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
                logo_alignment="center"></asl-google-signin-button>
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
      </mat-card>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly common = injectAuthCommon({ redirectUrl: '/' });

  protected readonly loginModel = signal<LoginModel>({ username: '', password: '' });
  protected readonly loginForm = form(
    this.loginModel,
    (s) => {
      required(s.username, { message: 'Username is required' });
      required(s.password, { message: 'Password is required' });
    },
    {
      submission: {
        action: async (f) => {
          const { username, password } = f().value();
          const success = await this.auth.login(username, password);

          if (!success) {
            this.snackBar.open('Invalid username or password.', 'Close', {
              duration: 10000,
            });
            return;
          }
          this.router.navigate(['/']);
        },
      },
    },
  );

  ngOnInit(): void {
    void this.auth.waitForSessionInit().then(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }

  protected async onForgotUsername() {
    const email = prompt('Please enter your email:');
    if (email) {
      const user = await this.auth.retrieveUsername(email);
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
          this.router.navigate(['/']);
        }, 1000);
      }
    } catch {
      this.snackBar.open('Passkey authentication failed or was cancelled.', 'Close', {
        duration: 10000,
      });
    }
  }
}
