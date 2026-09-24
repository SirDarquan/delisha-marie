import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';
import { getKitchenUrl } from '../../utils/navigation';

@Component({
  selector: 'dm-about',
  imports: [MatButtonModule, MatIconModule, ColoredHeaderComponent],
  template: `
    <article
      class="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12 text-[var(--mat-sys-on-surface)]">
      <!-- Header / Intro with Colored Header -->
      <div>
        <dm-colored-header title="About Delisha Marie" />
        <p
          class="text-lg md:text-xl text-[var(--mat-sys-on-surface-variant)] max-w-3xl leading-relaxed -mt-10">
          Elevating everyday home cooking into an art of warmth &amp; connection. From soulful
          generational recipes to modern kitchen discoveries, every dish is crafted with intention,
          patience, and love.
        </p>
      </div>

      <!-- Story Narrative -->
      <section
        class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-8 md:p-12 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-6 leading-relaxed text-base md:text-lg text-[var(--mat-sys-on-surface)] shadow-2xl">
        <h2 class="text-2xl font-bold text-[var(--mat-sys-primary)]">The Culinary Journey</h2>
        <p>
          Cooking was never just a routine in my family—it was the heartbeat of our home. Growing
          up, the kitchen was where stories were shared, laughter was loudest, and tradition was
          passed from one pair of hands to the next.
        </p>
        <p>
          I learned early on that the secret to truly memorable food isn't complicated
          technique—it's honoring authentic ingredients, giving time for flavors to deepen, and
          cooking with genuine care for the people gathering around your table.
        </p>
        <p>
          This website is a celebration of that journey: accessible guides, heirloom flavor
          profiles, and step-by-step masteries designed to bring confidence and warmth into your own
          kitchen.
        </p>
      </section>

      <!-- Philosophy Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-6 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-3 shadow-xl">
          <mat-icon class="!text-3xl text-[var(--mat-sys-primary)]">spa</mat-icon>
          <h3 class="text-xl font-bold text-[var(--mat-sys-on-surface)]">Real Ingredients</h3>
          <p class="text-sm md:text-base text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Wholesome, unpretentious ingredients cooked to highlight their purest, natural depths of
            flavor.
          </p>
        </div>

        <div
          class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-6 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-3 shadow-xl">
          <mat-icon class="!text-3xl text-[var(--mat-sys-primary)]">favorite</mat-icon>
          <h3 class="text-xl font-bold text-[var(--mat-sys-on-surface)]">Soul &amp; Heritage</h3>
          <p class="text-sm md:text-base text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Preserving culinary lineages while inspiring new, flavorful memories for your household.
          </p>
        </div>

        <div
          class="bg-[var(--mat-sys-surface-container)] backdrop-blur-md rounded-2xl p-6 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col gap-3 shadow-xl">
          <mat-icon class="!text-3xl text-[var(--mat-sys-primary)]">auto_awesome</mat-icon>
          <h3 class="text-xl font-bold text-[var(--mat-sys-on-surface)]">Kitchen Mastery</h3>
          <p class="text-sm md:text-base text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Tested techniques, precise proportions, and intuitive advice so every recipe turns out
            delicious.
          </p>
        </div>
      </div>

      <!-- Call to Action -->
      <section
        class="bg-gradient-to-r from-[var(--mat-sys-surface-container)] to-[var(--mat-sys-surface-container-high)] rounded-2xl p-8 md:p-12 border border-[var(--mat-sys-outline-variant)]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div class="flex flex-col gap-2 text-center sm:text-left">
          <h2 class="text-2xl font-bold text-[var(--mat-sys-on-surface)]">
            Ready to cook together?
          </h2>
          <p class="text-[var(--mat-sys-on-surface-variant)]">
            Explore step-by-step recipes, seasonal specialties, and time-tested meals.
          </p>
        </div>
        <a
          mat-flat-button
          [href]="kitchenUrl"
          class="!bg-[var(--mat-sys-primary)] !text-black !font-semibold !px-8 !py-6 !text-base shrink-0 hover:!opacity-95 transition-opacity">
          <mat-icon class="mr-2">restaurant_menu</mat-icon>
          Visit the Kitchen
        </a>
      </section>
    </article>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  readonly kitchenUrl = getKitchenUrl();
}
