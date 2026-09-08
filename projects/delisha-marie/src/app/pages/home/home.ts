import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FeaturedRecipes } from '../../components/featured-recipes/featured-recipes';
import { TopRatedRecipes } from '../../components/top-rated-recipes/top-rated-recipes';
import { AuthorBio } from '../../components/author-bio/author-bio';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'dm-home',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    NgOptimizedImage,
    FeaturedRecipes,
    TopRatedRecipes,
    AuthorBio,
    RouterLink,
  ],
  template: `
    <div class="space-y-16">
      <!-- Hero Section -->
      <section class="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        <img
          ngSrc="delisha_marie_hero_widescreen.png"
          priority
          fill
          alt="Delisha Marie Kitchen"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8 md:p-16">
          <div class="max-w-2xl text-white">
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Authentic flavors, <br /><span class="text-[var(--mat-sys-primary)]"
                >Handcrafted</span
              >
              with love.
            </h1>
            <p class="text-xl md:text-2xl font-light mb-8 text-gray-200">
              Join me in my culinary journey as we explore simple yet elegant recipes that bring
              people together.
            </p>
            <a
              mat-flat-button
              routerLink="/recipe-index"
              class="!flex !items-center !justify-center !h-14 !px-10 !rounded-full !text-lg font-bold shadow-lg shadow-red-500/20">
              Browse Latest Recipes
            </a>
          </div>
        </div>
      </section>

      <!-- Featured Recipes Section -->
      <dm-featured-recipes link="/recipes/dinner" />

      <dm-author-bio layout="horizontal" picture="delisha_marie_profile_2.png" />

      <!-- Top Rated Recipes Section -->
      <dm-top-rated-recipes />

      <!-- Featured Recipes Section -->
      <dm-featured-recipes link="/recipes/breakfast" />

      <!-- Featured Recipes Section -->
      <dm-featured-recipes link="/recipes/lunch" />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
