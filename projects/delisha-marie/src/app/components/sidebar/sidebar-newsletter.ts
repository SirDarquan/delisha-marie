import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dm-sidebar-newsletter',
  imports: [CommonModule, MatButtonModule, MatInputModule, MatFormFieldModule, FormRoot, FormField],
  template: `
    <section
      class="bg-[var(--mat-sys-surface-container-highest)] text-[var(--mat-sys-on-surface)] rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden group border-y sm:border-0 border-[var(--mat-sys-outline-variant)]"
      aria-labelledby="newsletter-title">
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors"></div>

      <h3 id="newsletter-title" class="text-2xl font-black mb-4 relative z-10">Stay Inspired</h3>
      <p class="text-sm opacity-80 mb-8 font-medium relative z-10 leading-relaxed">
        Join 50,000+ home cooks. Get my latest recipes and kitchen secrets once a week.
      </p>

      <form [formRoot]="newsletterForm" class="space-y-4 relative z-10">
        <mat-form-field appearance="outline" class="w-full newsletter-field">
          <input
            matInput
            [formField]="newsletterForm.email"
            placeholder="Your email address"
            aria-label="Email address" />
          @for (error of newsletterForm.email().errors(); track error.message) {
            <mat-error>{{ error.message }}</mat-error>
          }
        </mat-form-field>
        <button
          mat-flat-button
          type="submit"
          [disabled]="newsletterForm().invalid()"
          class="w-full h-12 rounded-full !bg-[var(--mat-sys-primary)] !text-[var(--mat-sys-on-primary)] font-bold shadow-lg shadow-primary/20">
          Subscribe Now
        </button>
      </form>
      <p class="text-[10px] text-center opacity-40 mt-6 uppercase tracking-widest font-black">
        No spam, just goodness.
      </p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      dm-sidebar-newsletter .newsletter-field .mat-mdc-text-field-wrapper {
        background: var(--mat-sys-surface-container);
        border-radius: 1.5rem;
      }
      dm-sidebar-newsletter .newsletter-field .mdc-notched-outline {
        display: none;
      }
      dm-sidebar-newsletter .newsletter-field input {
        color: var(--mat-sys-on-surface) !important;
      }
      dm-sidebar-newsletter .newsletter-field .mat-mdc-form-field-flex {
        padding-top: 0;
        padding-bottom: 0;
        height: 3.5rem;
        display: flex;
        align-items: center;
      }
      dm-sidebar-newsletter .newsletter-field .mat-mdc-form-field-subscript-wrapper {
        padding: 0 1rem;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNewsletter {
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
          alert(`Thanks for subscribing, ${f().value().email}!`);
          this.userModel.set({ email: '' });
        },
      },
    },
  );
}
