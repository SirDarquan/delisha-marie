import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'dm-sidebar-newsletter',
  imports: [CommonModule, MatButtonModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  template: `
    <section
      class="bg-[var(--mat-sys-on-surface)] text-[var(--mat-sys-surface)] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group"
      aria-labelledby="newsletter-title">
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors"></div>

      <h3 id="newsletter-title" class="text-2xl font-black mb-4 relative z-10">Stay Inspired</h3>
      <p class="text-sm opacity-80 mb-8 font-medium relative z-10 leading-relaxed">
        Join 50,000+ home cooks. Get my latest recipes and kitchen secrets once a week.
      </p>

      <div class="space-y-4 relative z-10">
        <mat-form-field appearance="outline" class="w-full newsletter-field">
          <input
            matInput
            [formControl]="emailControl"
            placeholder="Your email address"
            aria-label="Email address" />
        </mat-form-field>
        <button
          mat-flat-button
          [disabled]="emailControl.invalid"
          (click)="subscribe()"
          class="w-full h-12 rounded-full bg-[var(--mat-sys-primary)] text-white font-bold shadow-lg shadow-primary/20">
          Subscribe Now
        </button>
      </div>
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
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1.5rem;
      }
      dm-sidebar-newsletter .newsletter-field .mdc-notched-outline {
        display: none;
      }
      dm-sidebar-newsletter .newsletter-field input {
        color: white;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNewsletter {
  readonly emailControl = new FormControl('', [Validators.required, Validators.email]);

  subscribe() {
    if (this.emailControl.valid) {
      alert(`Thanks for subscribing, ${this.emailControl.value}!`);
      this.emailControl.reset();
    }
  }
}
