import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'dm-about',
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-16 py-12">
      <header class="text-center space-y-4">
        <h1 class="text-5xl md:text-6xl font-black tracking-tighter">
          About <span class="text-[var(--mat-sys-primary)]">Delisha Marie</span>
        </h1>
        <p
          class="text-xl text-[var(--mat-sys-on-surface-variant)] italic max-w-2xl mx-auto font-light">
          "Food is not just sustenance; it's a language of love shared across tables."
        </p>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div
          class="rounded-3xl overflow-hidden shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-500">
          <img
            src="delisha_marie_hero_widescreen.png"
            alt="Delisha Marie"
            class="w-full h-full object-cover aspect-video" />
        </div>

        <div class="space-y-6 text-lg leading-relaxed text-[var(--mat-sys-on-surface)]">
          <h2 class="text-3xl font-bold">The Journey</h2>
          <p>
            My name is Delisha Marie, and my kitchen is my sanctuary. What started as a small hobby
            of documenting my family's favorite Sunday dinners has blossomed into a lifelong passion
            for exploring flavors and textures.
          </p>
          <p>
            I believe that every recipe tells a story—of its origin, the hands that prepared it, and
            the memories created while enjoying it. My goal with this blog is to share those stories
            with you, one ingredient at a time.
          </p>
          <div
            class="p-6 bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)] rounded-2xl border-l-8 border-[var(--mat-sys-primary)] quote-box">
            "I focus on what I call 'Elevated Simplicity'—taking everyday ingredients and treating
            them with the respect they deserve to create something extraordinary."
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          class="p-8 bg-[var(--mat-sys-surface-container)] rounded-3xl space-y-4 border border-[var(--mat-sys-outline-variant)]">
          <div
            class="w-12 h-12 bg-[var(--mat-sys-primary)] text-white rounded-xl flex items-center justify-center font-bold text-2xl">
            01
          </div>
          <h3 class="text-xl font-bold">Philosophy</h3>
          <p class="text-sm text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Sustainable, seasonal, and soulful. I source local ingredients whenever possible to
            capture the peak of flavor.
          </p>
        </div>
        <div
          class="p-8 bg-[var(--mat-sys-surface-container)] rounded-3xl space-y-4 border border-[var(--mat-sys-outline-variant)]">
          <div
            class="w-12 h-12 bg-[var(--mat-sys-tertiary)] text-white rounded-xl flex items-center justify-center font-bold text-2xl">
            02
          </div>
          <h3 class="text-xl font-bold">Technique</h3>
          <p class="text-sm text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            Mastering the basics is the key to creativity. I provide detailed steps so you can build
            your confidence in the kitchen.
          </p>
        </div>
        <div
          class="p-8 bg-[var(--mat-sys-surface-container)] rounded-3xl space-y-4 border border-[var(--mat-sys-outline-variant)]">
          <div
            class="w-12 h-12 bg-gray-500 text-white rounded-xl flex items-center justify-center font-bold text-2xl">
            03
          </div>
          <h3 class="text-xl font-bold">Community</h3>
          <p class="text-sm text-[var(--mat-sys-on-surface-variant)] leading-relaxed">
            This space is for us. I love hearing your twists on my recipes and being inspired by
            your culinary adventures.
          </p>
        </div>
      </section>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {}
