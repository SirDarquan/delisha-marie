import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';
import { getApiUrl } from '../../utils/navigation';

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

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
    ColoredHeaderComponent,
  ],
  template: `
    <article
      class="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12 text-[var(--mat-sys-on-surface)]">
      <!-- Header with Colored Header -->
      <div>
        <dm-colored-header title="Get in Touch" />
        <p
          class="text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] max-w-2xl leading-relaxed -mt-10">
          Have a recipe question, culinary collaboration, press inquiry, or just want to share a
          kitchen story? Send a note below.
        </p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Contact Info Side Cards -->
        <aside class="flex flex-col gap-6 lg:col-span-1">
          <div
            class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-6 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-3 shadow-xl">
            <div class="flex items-center gap-3 text-[var(--mat-sys-primary)]">
              <mat-icon>handshake</mat-icon>
              <h2 class="text-lg font-bold text-[var(--mat-sys-on-surface)]">Collaborations</h2>
            </div>
            <p class="text-sm text-[var(--mat-sys-on-surface-variant)]">
              Partnerships, culinary workshops, recipe development, and media features.
            </p>
          </div>

          <div
            class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-6 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-3 shadow-xl">
            <div class="flex items-center gap-3 text-[var(--mat-sys-primary)]">
              <mat-icon>restaurant</mat-icon>
              <h2 class="text-lg font-bold text-[var(--mat-sys-on-surface)]">Recipe Questions</h2>
            </div>
            <p class="text-sm text-[var(--mat-sys-on-surface-variant)]">
              Need substitute suggestions or cooking advice? Let's troubleshoot together.
            </p>
          </div>
        </aside>

        <!-- Contact Form Box (copied directly from delisha-marie dm-contact-form) -->
        <section class="lg:col-span-2">
          <mat-card
            class="!bg-[var(--mat-sys-surface-container-low)] !rounded-3xl !p-8 border border-[var(--mat-sys-outline-variant)] shadow-2xl">
            <form [formRoot]="contactForm" class="flex flex-col gap-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Name</mat-label>
                  <input matInput [formField]="contactForm.name" placeholder="Joe Smith" />
                  @for (error of contactForm.name().errors(); track error.message) {
                    <mat-error>{{ error.message }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email</mat-label>
                  <input
                    matInput
                    [formField]="contactForm.email"
                    placeholder="yourname@example.com" />
                  @for (error of contactForm.email().errors(); track error.message) {
                    <mat-error>{{ error.message }}</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Subject</mat-label>
                <input
                  matInput
                  [formField]="contactForm.subject"
                  placeholder="Recipe question / collaboration inquiry" />
                @for (error of contactForm.subject().errors(); track error.message) {
                  <mat-error>{{ error.message }}</mat-error>
                }
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
        </section>
      </div>
    </article>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  protected readonly isSubmitting = signal(false);

  protected readonly userModel = signal<ContactSubmissionPayload>({
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
      required(fields.subject, { message: 'Subject is required' });
      required(fields.message, { message: 'Message is required' });
    },
    {
      submission: {
        action: async (fields) => {
          this.isSubmitting.set(true);
          const values = fields().value();
          try {
            await firstValueFrom(this.http.post(getApiUrl('/api/contacts'), values));
            this.snackBar.open(
              'Message sent successfully! Delisha will get back to you soon.',
              'Close',
              {
                duration: 5000,
                panelClass: ['success-snackbar'],
              },
            );
            this.userModel.set({ name: '', email: '', subject: '', message: '' });
          } catch (error) {
            console.error('Error submitting contact form:', error);
            this.snackBar.open('Failed to send message. Please try again later.', 'Close', {
              duration: 5000,
            });
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
