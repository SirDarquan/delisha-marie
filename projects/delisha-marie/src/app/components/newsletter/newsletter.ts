import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NewsletterService } from '../../services/newsletter.service';

@Component({
  selector: 'dm-newsletter',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormRoot,
    FormField,
  ],
  template: `
    <!-- Container-aware background wrapper -->
    <section
      [class]="
        '@container bg-[var(--mat-sys-surface-container-highest)] w-full ' +
        (layout() === 'full'
          ? 'py-12 border-t border-[var(--mat-sys-outline-variant)]'
          : 'hidden lg:block rounded-[2.5rem] p-6 sm:p-8 shadow-sm')
      ">
      <!-- Constrained content -->
      <div [class]="'w-full ' + (layout() === 'full' ? 'max-w-[900px] mx-auto px-4' : '')">
        <div
          class="flex flex-col @3xl:flex-row items-center justify-between gap-6 @3xl:gap-8 @5xl:gap-12">
          <!-- Words with picture (Left on large containers, Top on small) -->
          <div class="flex items-center gap-4 w-full @3xl:flex-1">
            <div
              class="bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-3 rounded-2xl flex-shrink-0">
              <mat-icon class="scale-125 origin-center block">mark_email_read</mat-icon>
            </div>
            <div>
              <h3 class="text-xl @2xl:text-2xl font-black m-0 mb-1 leading-tight">
                Get the latest recipes!
              </h3>
              <p class="text-sm @2xl:text-base opacity-80 m-0">
                Join our newsletter for weekly culinary inspiration.
              </p>
            </div>
          </div>

          @if (!isSubscribed()) {
            <!-- Form: Email + Button -->
            <form
              [formRoot]="newsletterForm"
              class="flex flex-col @5xl:flex-row w-full @3xl:w-auto gap-3 shrink-0 items-stretch @5xl:items-center pt-2">
              <div class="w-full @3xl:w-80 @5xl:w-72">
                <mat-form-field
                  appearance="outline"
                  subscriptSizing="dynamic"
                  class="w-full newsletter-field">
                  <input
                    matInput
                    type="email"
                    [formField]="newsletterForm.email"
                    placeholder="Your email address"
                    aria-label="Email address" />
                  @for (error of newsletterForm.email().errors(); track error.message) {
                    <mat-error>{{ error.message }}</mat-error>
                  }
                </mat-form-field>
              </div>

              <button
                mat-flat-button
                type="submit"
                [disabled]="newsletterForm().invalid() || isSubmitting()"
                class="rounded-full px-8 !h-12 text-base font-bold w-full @5xl:w-auto !bg-[var(--mat-sys-primary)] !text-[var(--mat-sys-on-primary)] shadow-lg shadow-primary/20">
                Subscribe
              </button>
            </form>
          } @else {
            <!-- Success Message -->
            <div
              class="w-full @3xl:w-96 @5xl:w-auto shrink-0 bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] p-5 rounded-2xl flex items-center gap-4 shadow-sm border border-[var(--mat-sys-primary)]/10">
              <mat-icon class="text-[var(--mat-sys-primary)] shrink-0">check_circle</mat-icon>
              <p class="m-0 font-medium leading-snug">
                Thank you! You'll be getting an email shortly to confirm your subscription.
              </p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Newsletter {
  layout = input<'full' | 'box'>('full');

  private readonly newsletterService = inject(NewsletterService);

  isSubscribed = signal(false);
  isSubmitting = signal(false);

  protected readonly userModel = signal({
    email: '',
  });

  protected readonly newsletterForm = form(
    this.userModel,
    (fields) => {
      required(fields.email, { message: 'Email is required' });
      email(fields.email, { message: 'Email is invalid' });
    },
    {
      submission: {
        action: async (f) => {
          this.isSubmitting.set(true);
          try {
            await this.newsletterService.subscribe(f().value().email);
            this.isSubscribed.set(true);
            f().reset({ email: '' });
          } catch (error) {
            console.error('Subscription failed', error);
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );
}
