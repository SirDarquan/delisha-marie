import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'dm-sidebar-search',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  template: `
    <section
      class="bg-[var(--mat-sys-surface-container-highest)] text-[var(--mat-sys-on-surface)] rounded-[2.5rem] p-6 sm:p-8 shadow-sm border-y sm:border-0 border-[var(--mat-sys-outline-variant)]"
      aria-labelledby="search-title">
      <h3 id="search-title" class="text-xl font-black mb-6 flex items-center gap-2">
        <mat-icon class="scale-90">search</mat-icon>
        Find a Recipe
      </h3>
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        class="w-full rounded-full overflow-hidden search-field">
        <mat-icon matPrefix class="opacity-50">search</mat-icon>
        <input
          matInput
          [formControl]="searchControl"
          placeholder="e.g. Lemon Cake..."
          (keyup.enter)="search()" />
      </mat-form-field>
      <button
        mat-flat-button
        color="primary"
        class="w-full h-12 rounded-full mt-4 font-bold"
        (click)="search()">
        Search
      </button>
    </section>
  `,

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSearch {
  private readonly router = inject(Router);
  readonly searchControl = new FormControl('');

  search() {
    const query = this.searchControl.value;
    if (query?.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: query.trim() } });
    }
  }
}
