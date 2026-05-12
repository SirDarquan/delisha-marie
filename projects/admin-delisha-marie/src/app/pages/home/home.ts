import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';

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
          <button
            mat-stroked-button
            color="warn"
            (click)="onLogout()"
            class="border-rose-500 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
            Log Out
          </button>
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
      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-purple-400">schedule</span> Recent Creations
        </h2>

        @if (recentRecipes().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (recipe of recentRecipes(); track recipe.id) {
              <div
                class="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-700 transition">
                <span
                  class="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 font-semibold uppercase tracking-wider">
                  {{ recipe.category }}
                </span>
                <h3 class="text-base font-bold text-white mt-2 mb-1 truncate">
                  {{ recipe.title }}
                </h3>
                <p class="text-slate-400 text-xs truncate">By {{ recipe.author || 'Chef' }}</p>
                <div
                  class="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
                  <span class="text-slate-500 text-xs font-semibold flex items-center gap-1">
                    <span class="material-icons text-slate-500 text-sm">schedule</span>
                    {{ recipe.prepTime }} prep
                  </span>
                  <a
                    [routerLink]="['/recipes/edit', recipe.id]"
                    class="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                    Edit <span class="material-icons text-xs">edit</span>
                  </a>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <span class="material-icons text-slate-600 text-4xl mb-2">dinner_dining</span>
            <p class="text-slate-400 font-medium text-sm">
              No recipes found yet. Get started by creating your first recipe!
            </p>
          </div>
        }
      </section>
    </div>
  `,
})
export class HomeComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = computed(() => this.authService.currentUser());
  readonly totalRecipes = computed(() => this.recipeService.recipes().length);
  readonly recentRecipes = computed(() => this.recipeService.recipes().slice(-3).reverse());

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
