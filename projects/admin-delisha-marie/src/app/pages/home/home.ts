import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1
            class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Delisha Marie Admin
          </h1>
          <p class="text-slate-400 text-sm font-medium mt-1">
            Welcome back,
            @if (user()) {
              {{ user()?.user_metadata?.username }}
            } @else {
              Admin
            }
            !
          </p>
        </div>
        <div>
        </div>
      </header>

      <main class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Stats Card: Total Recipes -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl transition hover:-translate-y-1 duration-300">
          <div class="flex justify-between items-center mb-4">
            <span class="text-slate-400 text-sm font-bold uppercase tracking-wider"
              >Total Recipes</span
            >
            <span class="material-icons text-purple-400">restaurant</span>
          </div>
          <p class="text-4xl font-extrabold text-white">{{ totalRecipes() }}</p>
          <p class="text-slate-500 text-xs mt-2 font-medium">Active and published dishes</p>
        </div>

        <!-- Quick Action: Manage Recipes -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl transition hover:-translate-y-1 duration-300 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-4">
              <span class="text-slate-400 text-sm font-bold uppercase tracking-wider"
                >Recipe Directory</span
              >
              <span class="material-icons text-pink-400">list_alt</span>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">
              Browse, filter, edit, or delete existing recipes in your collection.
            </p>
          </div>
          <div class="mt-6">
            <a
              routerLink="/recipes"
              class="inline-block w-full text-center py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition border border-slate-700 cursor-pointer">
              View All Recipes
            </a>
          </div>
        </div>

        <!-- Quick Action: Add New Recipe -->
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl transition hover:-translate-y-1 duration-300 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-4">
              <span class="text-slate-400 text-sm font-bold uppercase tracking-wider"
                >Creator Hub</span
              >
              <span class="material-icons text-emerald-400">add_circle_outline</span>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">
              Create and publish a brand new recipe to your readers instantly.
            </p>
          </div>
          <div class="mt-6">
            <a
              routerLink="/recipes/create"
              class="inline-block w-full text-center py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer">
              + Create Recipe
            </a>
          </div>
        </div>
      </main>

      <!-- Recent Recipes Section -->
    </div>
  `,
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly user = computed(() => ({user_metadata: {username: 'Admin'}}));
  readonly totalRecipes = computed(() => 0);
  readonly recentRecipes = computed(() => []);

}
