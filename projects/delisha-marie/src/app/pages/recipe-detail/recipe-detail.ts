import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { Sidebar } from '../../components/sidebar/sidebar';
import { SidebarQuickView } from '../../components/sidebar/sidebar-quick-view';
import { Recipe } from '../../services/recipe.service';
import { RecipeCard } from './recipe-card';
import { RecipeComments } from './recipe-comments';
import { RecipeHero } from './recipe-hero';
import { RecipeMeta } from './recipe-meta';
import { RecipeNavigation } from './recipe-navigation';
import { RecipeTags } from './recipe-tags';

@Component({
  selector: 'dm-recipe-detail',
  imports: [
    CommonModule,
    Breadcrumbs,
    RecipeHero,
    MatIconModule,
    MatButtonModule,
    Sidebar,
    SidebarQuickView,
    RecipeCard,
    RecipeTags,
    RecipeNavigation,
    RecipeComments,
    RecipeMeta,
    RouterLink,
  ],
  template: `
    <div class="into-the-box pt-12 pb-12">
      @if (isLoading()) {
        <!-- Skeleton Loader Layout -->
        <div class="block mb-8 px-4 sm:px-0 mt-4 sm:mt-0">
          <div class="h-6 w-64 skeleton rounded"></div>
        </div>

        <div class="w-full animate-pulse">
          <!-- Hero Skeleton -->
          <div class="h-[300px] md:h-[450px] w-full skeleton rounded-3xl mb-8"></div>

          <div class="max-w-7xl mx-auto sm:px-4 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Main Content Skeleton -->
              <div class="flex-1 space-y-12">
                <div class="space-y-4 px-4 sm:px-0">
                  <div class="h-10 w-3/4 skeleton rounded"></div>
                  <div class="h-6 w-1/2 skeleton rounded"></div>
                  <div class="space-y-2 mt-6">
                    <div class="h-4 w-full skeleton rounded"></div>
                    <div class="h-4 w-full skeleton rounded"></div>
                    <div class="h-4 w-5/6 skeleton rounded"></div>
                  </div>
                </div>

                <!-- Card Skeleton -->
                <div class="h-[400px] w-full skeleton rounded-3xl"></div>
              </div>

              <!-- Sidebar Skeleton -->
              <aside class="w-full lg:w-[350px] shrink-0">
                <div class="h-[300px] w-full skeleton rounded-3xl"></div>
              </aside>
            </div>
          </div>
        </div>
      } @else if (recipe(); as r) {
        <!-- Breadcrumbs -->
        <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8 px-4 sm:px-0 mt-4 sm:mt-0" />

        <dml-recipe-meta [recipe]="r" class="block mb-8 px-4 sm:px-0" />

        <article class="w-full">
          <!-- Hero Section -->
          <dml-recipe-hero [recipe]="r" />

          <!-- Story & Metrics Area -->
          <div class="max-w-7xl mx-auto sm:px-4 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- Main Content Area -->
              <div class="flex-1 space-y-12">
                <section class="prose prose-lg max-w-none px-4 sm:px-0 py-8 sm:py-0">
                  <div
                    class="recipe-story text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
                    [innerHTML]="r.content"></div>
                </section>

                <!-- Premium Recipe Card -->
                <dml-recipe-card [recipe]="r" />

                <!-- Recipe Tags -->
                <dml-recipe-tags [recipe]="r" />

                <!-- Recipe Navigation -->
                <dml-recipe-navigation [previous]="r.navigation.prev" [next]="r.navigation.next" />

                <!-- Comments Section -->
                <dml-recipe-comments [recipe]="r" [page]="page()" />
              </div>

              <!-- Sidebar -->
              <aside class="w-full lg:w-[350px] shrink-0">
                <dml-sidebar>
                  <div class="sticky top-24">
                    <dm-sidebar-quick-view [recipe]="r" />
                  </div>
                </dml-sidebar>
              </aside>
            </div>
          </div>
        </article>
      } @else {
        <div class="py-40 text-center max-w-xl mx-auto">
          <mat-icon class="text-9xl h-auto w-auto opacity-10 mb-8 text-[var(--mat-sys-primary)]"
            >search_off</mat-icon
          >
          <h2 class="text-5xl font-black tracking-tighter mb-4">Recipe not found</h2>
          <p class="text-xl text-[var(--mat-sys-on-surface-variant)] mb-12 font-medium">
            Sorry, the culinary masterpiece you're looking for seems to have vanished from our
            kitchen.
          </p>
          <a
            mat-flat-button
            routerLink="/recipe-index"
            class="h-14 px-10 rounded-full text-lg font-bold">
            Back to Recipe Index
          </a>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .recipe-story p {
        margin-bottom: 2.5rem;
      }
      .recipe-story p:last-child {
        margin-bottom: 0;
      }
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--mat-sys-surface-container) 25%,
          var(--mat-sys-surface-container-high) 50%,
          var(--mat-sys-surface-container) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetail {
  recipe = input<Recipe | null | undefined>(undefined);

  page = input<string>();

  readonly isLoading = computed(() => this.recipe() === undefined);

  readonly breadcrumbItems = computed((): BreadcrumbItem[] => {
    const r = this.recipe();
    if (!r) return [];
    const idx = r.breadcrumbs.main;
    return typeof idx === 'number' ? r.breadcrumbs.items[idx] : [];
  });
}
