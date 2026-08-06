import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { PagesService } from '../../services/pages.service';

@Component({
  selector: 'app-pages-list',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="px-4 md:px-8 py-8 space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white">Other Pages</h1>
          <p class="text-slate-400 mt-1">Manage static and dynamic pages for your site</p>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-800 bg-slate-900/50">
                  <th class="py-4 px-6 font-semibold text-slate-300 text-sm w-1/3">Title</th>
                  <th class="py-4 px-6 font-semibold text-slate-300 text-sm">Slug</th>
                  <th class="py-4 px-6 font-semibold text-slate-300 text-sm">Last Updated</th>
                  <th class="py-4 px-6 font-semibold text-slate-300 text-sm w-32 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                @for (page of pages(); track page.slug) {
                  <tr class="hover:bg-slate-800/20 transition group">
                    <td class="py-4 px-6">
                      <span class="font-medium text-slate-200">{{ page.title }}</span>
                    </td>
                    <td class="py-4 px-6">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                        /{{ page.slug }}
                      </span>
                    </td>
                    <td class="py-4 px-6 text-sm text-slate-400">
                      {{ (page.updated_at | date: 'medium') || 'Never' }}
                    </td>
                    <td class="py-4 px-6 text-right">
                      <a
                        mat-icon-button
                        [routerLink]="['/pages', page.slug]"
                        class="!text-slate-400 hover:!text-purple-400"
                        aria-label="Edit page">
                        <mat-icon>edit</mat-icon>
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center gap-2">
                        <mat-icon class="!text-4xl text-slate-600 mb-2">article</mat-icon>
                        <p class="font-medium text-slate-300">No pages found</p>
                        <p class="text-sm">Default pages like /about are not yet customized.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesListComponent {
  private readonly pagesService = inject(PagesService);

  private readonly _pagesResource = resource({
    loader: () => this.pagesService.getPages(),
  });

  protected readonly loading = computed(() => this._pagesResource.isLoading());

  protected readonly pages = computed(() => {
    if (this._pagesResource.error()) return [];
    const db = this._pagesResource.value() || [];
    return db.filter((page, index, self) => index === self.findIndex((p) => p.slug === page.slug));
  });
}
