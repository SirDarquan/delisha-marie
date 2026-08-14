import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  linkedSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

interface SearchRecipes {
  query: string;
}

@Component({
  selector: 'dm-sidebar-search',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormField,
    FormRoot,
  ],
  template: `
    <section
      class="bg-[var(--mat-sys-surface-container-highest)] text-[var(--mat-sys-on-surface)] rounded-[2.5rem] p-6 sm:p-8 shadow-sm border-y sm:border-0 border-[var(--mat-sys-outline-variant)]"
      aria-labelledby="search-title">
      <h3 id="search-title" class="text-xl font-black mb-6 flex items-center gap-2">
        <mat-icon class="scale-90">search</mat-icon>
        Find a Recipe
      </h3>
      <form [formRoot]="searchForm">
        <mat-form-field
          appearance="outline"
          subscriptSizing="dynamic"
          class="w-full rounded-full overflow-hidden search-field">
          <mat-icon matPrefix class="opacity-50">search</mat-icon>
          <input matInput [formField]="searchForm.query" placeholder="e.g. Lemon Cake..." />
        </mat-form-field>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="w-full h-12 rounded-full mt-4 font-bold">
          Search
        </button>
      </form>
    </section>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSearch {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams);

  readonly queryModel = linkedSignal<SearchRecipes>(() => ({
    query: this.queryParams()?.['q'] || '',
  }));

  readonly searchForm = form(
    this.queryModel,
    (s) => {
      required(s.query, { message: 'Please enter a search query' });
    },
    {
      submission: {
        action: async (f) => {
          const q = f().value().query;
          if (q?.trim()) {
            this.router.navigate(['/search'], { queryParams: { q: q.trim() } });
          }
        },
      },
    },
  );
}
