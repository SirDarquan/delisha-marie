import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';
import { LatestRecipes } from '../../components/latest-recipes/latest-recipes';

@Component({
  selector: 'dm-latest-recipes-page',
  imports: [CommonModule, Breadcrumbs, ColoredHeaderComponent, LatestRecipes],
  template: `
    <div class="into-the-box pt-12 pb-4">
      <!-- Breadcrumbs -->
      <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8" />

      <!-- Page Header -->
      <dm-colored-header title="Latest Recipes" size="small" />

      <!-- Latest Recipes Grid with Pagination -->
      <div class="mt-8">
        <dm-latest-recipes [page]="currentPage()" [showSectionTitle]="false" />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestRecipesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.params);

  readonly currentPage = computed(() => {
    const p = this.params()?.['page'];
    const parsed = p ? Number.parseInt(p, 10) : 1;
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });

  readonly breadcrumbItems = computed((): BreadcrumbItem[] => {
    const page = this.currentPage();
    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/' },
      { label: 'Latest Recipes', url: page > 1 ? '/' : undefined },
    ];

    if (page > 1) {
      items.push({ label: `Page ${page}` });
    }

    return items;
  });
}
