import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ViewEncapsulation,
} from '@angular/core';
import { CategoryImages } from '../../components/category-images/category-images';
import { FeaturedRecipes } from '../../components/featured-recipes/featured-recipes';
import { TopRatedRecipes } from '../../components/top-rated-recipes/top-rated-recipes';
import { LatestRecipes } from '../../components/latest-recipes/latest-recipes';
import { AuthorBio } from '../../components/author-bio/author-bio';
import { RecipeIndexService } from '../recipe-index/recipe-index.service';
import { PagesService } from '../../services/pages.service';

export interface KitchenHomeConfig {
  featuredRecipes?: string[];
  picture?: string;
  title?: string;
  description?: string;
}

@Component({
  selector: 'dm-home',
  imports: [CategoryImages, FeaturedRecipes, TopRatedRecipes, LatestRecipes, AuthorBio],
  template: `
    <div class="space-y-16">
      <!-- Top Cover Slot (Ready for upcoming hero/cover additions) -->
      <div id="home-cover" class="home-cover-slot" aria-label="Kitchen Home Cover">
        <!-- Upcoming cover elements will be placed here -->
      </div>

      <!-- Category Images Section -->
      <section data-testid="home-section-category-images">
        <dm-category-images [categories]="featuredCategories()" />
      </section>

      <!-- Latest Recipes Section -->
      <section data-testid="home-section-latest-recipes">
        <dm-latest-recipes />
      </section>

      <!-- Featured Recipes #1 Section -->
      <section data-testid="home-section-featured-recipes-1">
        <dm-featured-recipes [link]="featuredRecipes1()" />
      </section>

      <!-- Author Bio / About Me Section -->
      <section data-testid="home-section-author-bio">
        <dm-author-bio layout="horizontal" [picture]="picture()" />
      </section>

      <!-- Top Rated Recipes Section -->
      <section data-testid="home-section-top-rated-recipes">
        <dm-top-rated-recipes />
      </section>

      <!-- Featured Recipes #2 Section -->
      <section data-testid="home-section-featured-recipes-2">
        <dm-featured-recipes [link]="featuredRecipes2()" />
      </section>

      <!-- Featured Recipes #3 Section -->
      <section data-testid="home-section-featured-recipes-3">
        <dm-featured-recipes [link]="featuredRecipes3()" />
      </section>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly pagesService = inject(PagesService);
  private readonly recipeIndexService = inject(RecipeIndexService);

  // Load Kitchen Home page saved by the user in Admin
  protected readonly _homePageResource = resource({
    loader: () => this.pagesService.getPage('home'),
  });

  // Parse user configuration
  protected readonly homeConfig = computed<KitchenHomeConfig | null>(() => {
    const page = this._homePageResource.value();
    if (!page?.content) return null;
    try {
      return JSON.parse(page.content) as KitchenHomeConfig;
    } catch {
      return null;
    }
  });

  // Direct user configuration: empty input returns '' which signals @if not to show up
  readonly featuredRecipes1 = computed(() => this.homeConfig()?.featuredRecipes?.[0] ?? '');

  readonly featuredRecipes2 = computed(() => this.homeConfig()?.featuredRecipes?.[1] ?? '');

  readonly featuredRecipes3 = computed(() => this.homeConfig()?.featuredRecipes?.[2] ?? '');

  readonly picture = computed(() => this.homeConfig()?.picture ?? 'delisha_marie_profile_2.png');

  readonly featuredCategories = computed(
    () => this.recipeIndexService.indexResource.value()?.featuredCategories || [],
  );
}
