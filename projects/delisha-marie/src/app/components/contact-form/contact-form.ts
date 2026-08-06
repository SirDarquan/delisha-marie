import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'dm-contact-form',
  imports: [
    FormRoot,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCard,
    MatSnackBarModule,
  ],
  template: `
    <mat-card
      class="!bg-[var(--mat-sys-surface-container-low)] !rounded-3xl !p-8 border border-[var(--mat-sys-outline-variant)] my-12">
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
            <input matInput [formField]="contactForm.email" placeholder="hello@delishamarie.com" />
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactForm {
  private readonly snackBar = inject(MatSnackBar);
  protected readonly isSubmitting = signal(false);

  protected readonly userModel = signal({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

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
        action: async (fields) => {
          this.isSubmitting.set(true);
          // const values = fields().value();
          try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            this.snackBar.open(
              'Message sent successfully! Delisha will get back to you soon.',
              'Close',
              {
                duration: 5000,
                panelClass: ['success-snackbar'],
              },
            );
            this.userModel.set({ name: '', email: '', subject: '', message: '' });
          } finally {
            this.isSubmitting.set(false);
            fields().reset({
              name: '',
              email: '',
              subject: '',
              message: '',
            });
          }
        },
      },
    },
  );
}
