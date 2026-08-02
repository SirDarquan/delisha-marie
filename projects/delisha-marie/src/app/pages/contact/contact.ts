import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'dm-contact',
  imports: [
    FormRoot,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCard,
    MatSnackBarModule,
    Sidebar,
  ],
  template: `
    <div class="into-the-box py-12">
      <div class="flex flex-col lg:flex-row gap-12">
        <!-- Main Content -->
        <div class="lg:w-2/3">
          <div class="text-center lg:text-left mb-12 space-y-4">
            <h1 class="text-5xl font-black tracking-tighter">
              Get in <span class="text-[var(--mat-sys-primary)]">Touch</span>
            </h1>
            <p class="text-[var(--mat-sys-on-surface-variant)] text-lg font-light">
              Have a question about a recipe? Or just want to say hi? I'd love to hear from you.
            </p>
          </div>

          <mat-card
            class="!bg-[var(--mat-sys-surface-container-low)] !rounded-3xl !p-8 border border-[var(--mat-sys-outline-variant)]">
            <form [formRoot]="contactForm" class="flex flex-col gap-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Name</mat-label>
                  <input matInput [formField]="contactForm.name" placeholder="Delisha Marie" />
                  @for (error of contactForm.name().errors(); track error.message) {
                    <mat-error>{{ error.message }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email</mat-label>
                  <input
                    matInput
                    [formField]="contactForm.email"
                    placeholder="hello@delishamarie.com" />
                  @for (error of contactForm.email().errors(); track error.message) {
                    <mat-error>{{ error.message }}</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Subject</mat-label>
                <input matInput [formField]="contactForm.subject" placeholder="Recipe question" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Message</mat-label>
                <textarea
                  matInput
                  [formField]="contactForm.message"
                  rows="5"
                  placeholder="Your beautiful message..."></textarea>
                @for (error of contactForm.message().errors(); track error.message) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              </mat-form-field>

              <button
                mat-flat-button
                class="!h-16 !rounded-2xl !text-xl font-bold shadow-xl shadow-red-500/10 hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                type="submit"
                [disabled]="contactForm().invalid() || isSubmitting()">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin">sync</mat-icon>
                  Sending...
                } @else {
                  <mat-icon>send</mat-icon>
                  Send Message
                }
              </button>
            </form>
          </mat-card>

          <div
            class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center p-8 bg-[var(--mat-sys-surface-container-high)] rounded-3xl">
            <div class="space-y-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">email</mat-icon>
              <p class="text-sm font-bold uppercase tracking-widest">Email</p>
              <p class="text-xs text-[var(--mat-sys-on-surface-variant)]">
                hello&#64;delishamarie.com
              </p>
            </div>
            <div class="space-y-2 border-x border-[var(--mat-sys-outline-variant)]">
              <mat-icon class="text-[var(--mat-sys-primary)]">place</mat-icon>
              <p class="text-sm font-bold uppercase tracking-widest">Studio</p>
              <p class="text-xs text-[var(--mat-sys-on-surface-variant)]">Dallas, TX</p>
            </div>
            <div class="space-y-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">time_to_leave</mat-icon>
              <p class="text-sm font-bold uppercase widest">Social</p>
              <p class="text-xs text-[var(--mat-sys-on-surface-variant)]">&#64;delishamarie</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="lg:w-1/3">
          <dml-sidebar />
        </aside>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly snackBar = inject(MatSnackBar);
  protected readonly isSubmitting = signal(false);

  // Define the form model directly as a signal
  protected readonly userModel = signal({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Create the Signal Form with the formRoot declarative submission pattern
  protected readonly contactForm = form(
    this.userModel,
    (fields) => {
      required(fields.name, { message: 'Name is required' });
      required(fields.email, { message: 'Email is required' });
      email(fields.email, { message: 'Email is invalid' });
      required(fields.message, { message: 'Message is required' });
    },
    {
      submission: {
        action: async () => {
          this.isSubmitting.set(true);
          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            this.snackBar.open(
              'Message sent successfully! Delisha will get back to you soon.',
              'Close',
              {
                duration: 5000,
                panelClass: ['success-snackbar'],
              },
            );
            // Reset form if needed (by resetting the model signal)
            this.userModel.set({ name: '', email: '', subject: '', message: '' });
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );
}
