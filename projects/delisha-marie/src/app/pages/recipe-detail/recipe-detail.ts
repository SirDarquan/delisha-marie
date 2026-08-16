import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { Sidebar } from '../../components/sidebar/sidebar';
import { SidebarQuickView } from '../../components/sidebar/sidebar-quick-view';
import { PinterestHoverDirective } from '../../directives/pinterest-hover.directive';
import { Recipe } from '../../services/recipe.service';
import { RecipeCard } from './recipe-card';
import { RecipeComments } from './recipe-comments';
import { RecipeHero } from './recipe-hero';
import { RecipeMeta } from './recipe-meta';
import { RecipeNavigation } from './recipe-navigation';
import { RecipeSource } from './recipe-source';
import { RecipeTags } from './recipe-tags';
import { extractYouTubeVideoId } from '@dm/library';
import { useOptimizedContent } from '../../utils/optimized-content';
import { RecipeEquipment } from '../../components/recipe-equipment/recipe-equipment';

@Component({
  selector: 'dm-recipe-detail',
  imports: [
    Breadcrumbs,
    RecipeHero,
    MatIconModule,
    MatButtonModule,
    Sidebar,
    SidebarQuickView,
    RecipeCard,
    RecipeTags,
    RecipeSource,
    RecipeNavigation,
    RecipeComments,
    RecipeMeta,
    RouterLink,
    PinterestHoverDirective,
    RecipeEquipment,
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
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
              <!-- Main Content Skeleton -->
              <div class="order-1 lg:order-none space-y-4 px-4 sm:px-0 min-w-0">
                <div class="h-10 w-3/4 skeleton rounded"></div>
                <div class="h-6 w-1/2 skeleton rounded"></div>
                <div class="space-y-2 mt-6">
                  <div class="h-4 w-full skeleton rounded"></div>
                  <div class="h-4 w-full skeleton rounded"></div>
                  <div class="h-4 w-5/6 skeleton rounded"></div>
                </div>
              </div>

              <!-- Sidebar Skeleton -->
              <aside class="order-3 lg:order-none w-full shrink-0">
                <div class="h-[300px] w-full skeleton rounded-3xl"></div>
              </aside>

              <!-- Card Skeleton -->
              <div class="order-2 lg:order-none min-w-0 lg:col-start-1 lg:row-start-2">
                <div class="h-[400px] w-full skeleton rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      } @else if (recipe(); as r) {
        <!-- Breadcrumbs -->
        <dml-breadcrumbs [items]="breadcrumbItems()" class="block mb-8 px-4 sm:px-0 mt-4 sm:mt-0" />

        <dml-recipe-meta
          [recipe]="r"
          [commentCountOverride]="commentCountOverride()"
          class="block mb-8 px-4 sm:px-0" />

        <article class="w-full">
          <!-- Hero Section -->
          <dml-recipe-hero [recipe]="r" [dmPinterestHover]="r" />

          <!-- Story & Metrics Area -->
          <div class="max-w-7xl mx-auto sm:px-4 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
              <!-- Story Section (Row 1, Col 1 on Desktop) -->
              <section
                class="order-1 lg:order-none prose prose-lg max-w-none px-4 sm:px-0 py-8 sm:py-0 min-w-0">
                <div
                  class="story text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] leading-relaxed font-serif first-letter:text-6xl first-letter:font-black first-letter:mr-1 first-letter:text-[var(--mat-sys-primary)]"
                  [innerHTML]="optimizedContent()"
                  [dmPinterestHover]="r"></div>

                @if (videoId()) {
                  <div
                    class="mt-12 mb-8 flex justify-center w-full rounded-2xl overflow-hidden shadow-lg border border-[var(--mat-sys-outline-variant)]">
                    <iframe
                      width="100%"
                      height="400"
                      [src]="safeVideoUrl()"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen></iframe>
                  </div>
                }
              </section>

              <!-- Sidebar (Row 1, Col 2 on Desktop) -->
              <aside class="order-3 lg:order-none w-full shrink-0">
                <dml-sidebar>
                  <div class="sticky top-24">
                    <dm-sidebar-quick-view [recipe]="r" />
                  </div>
                </dml-sidebar>
              </aside>

              <!-- Rest of the content (Row 2, Col 1 on Desktop) -->
              <div class="order-2 lg:order-none space-y-12 min-w-0 lg:col-start-1 lg:row-start-2">
                <!-- Premium Recipe Card -->
                <dml-recipe-card [recipe]="r" />

                <!-- Equipment -->
                <dm-recipe-equipment [recipeId]="r.id" />

                <!-- Recipe Source -->
                <dml-recipe-source [recipe]="r" />

                <!-- Recipe Tags -->
                <dml-recipe-tags [recipe]="r" />

                <!-- Recipe Navigation -->
                <dml-recipe-navigation [previous]="r.navigation.prev" [next]="r.navigation.next" />

                <!-- Comments Section -->
                <dml-recipe-comments
                  [recipe]="r"
                  [page]="page()"
                  (commentCountChange)="commentCountOverride.set($event)" />
              </div>
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

  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetail {
  recipe = input<Recipe | null | undefined>(undefined);

  page = input<string>();

  test = computed(() => {
    console.log();
  });

  commentCountOverride = signal<number | null>(null);

  readonly isLoading = computed(() => this.recipe() === undefined);

  readonly videoId = computed(() => extractYouTubeVideoId(this.recipe()?.video));

  readonly breadcrumbItems = computed((): BreadcrumbItem[] => {
    const r = this.recipe();
    if (!r) return [];
    const idx = r.breadcrumbs.main;
    return typeof idx === 'number' ? r.breadcrumbs.items[idx] : [];
  });

  private readonly sanitizer = inject(DomSanitizer);

  readonly safeVideoUrl = computed(() => {
    const id = this.videoId();
    return id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`)
      : null;
  });

  readonly optimizedContent = useOptimizedContent(computed(() => this.recipe()?.content));

  private readonly document = inject(DOCUMENT);

  private readonly _scrollEffect = effect(() => {
    // Run when recipe finishes loading
    if (!this.isLoading()) {
      const window = this.document.defaultView;
      const hash = window?.location.hash;
      if (hash) {
        // Wait a tick for the DOM to render the components
        setTimeout(() => {
          const id = hash.replace('#', '');
          const el = this.document.getElementById(id);
          if (el && window) {
            const y = el.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      }
    }
  });
}
