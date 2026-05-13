import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewEncapsulation,
  InjectionToken,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LowerCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';

export const ADMIN_BRAND_TOKEN = new InjectionToken<string>('adminBrandTitle');

@Component({
  selector: 'app-recipes-list',
  imports: [RouterLink, LowerCasePipe, MatButtonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <header class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1
            class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {{ brandTitle }}
          </h1>
          <p class="text-slate-400 text-sm font-medium mt-1">Manage Recipes</p>
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

      <main
        class="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md">
        <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div class="flex-1 max-w-md">
            <label for="search" class="sr-only">Search recipes</label>
            <input
              id="search"
              type="text"
              placeholder="Search by title, category..."
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
              class="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
          </div>
          <a
            routerLink="/recipes/create"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer">
            + New Recipe
          </a>
        </div>

        <div class="overflow-x-auto border border-slate-800/60 rounded-xl">
          <table class="w-full text-left border-collapse" aria-label="List of all recipes">
            <thead>
              <tr class="bg-slate-800/30">
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Title
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Category
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Prep Time
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Cook Time
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Difficulty
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40">
              @for (recipe of filteredRecipes(); track recipe.id) {
                <tr class="hover:bg-slate-800/20 transition">
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                      @if (recipe.image) {
                        <img
                          [src]="recipe.image"
                          alt=""
                          class="w-11 h-11 object-cover rounded-lg border border-slate-700/50 bg-slate-800" />
                      }
                      <strong class="text-sm font-semibold text-white">{{ recipe.title }}</strong>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm text-slate-300">{{ recipe.category || 'N/A' }}</td>
                  <td class="px-4 py-4 text-sm text-slate-300">{{ recipe.prepTime || 'N/A' }}</td>
                  <td class="px-4 py-4 text-sm text-slate-300">{{ recipe.cookTime || 'N/A' }}</td>
                  <td class="px-4 py-4 text-sm">
                    @let diff = recipe.difficulty || 'Easy' | lowercase;
                    <span
                      class="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide capitalize"
                      [class.bg-green-500/10]="diff === 'easy'"
                      [class.text-green-400]="diff === 'easy'"
                      [class.bg-yellow-500/10]="diff === 'intermediate'"
                      [class.text-yellow-400]="diff === 'intermediate'"
                      [class.bg-rose-500/10]="diff === 'advanced'"
                      [class.text-rose-400]="diff === 'advanced'">
                      {{ recipe.difficulty || 'Easy' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <a
                        [routerLink]="['/recipes/edit', recipe.id]"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 transition cursor-pointer"
                        aria-label="Edit recipe">
                        Edit
                      </a>
                      <button
                        mat-button
                        color="warn"
                        (click)="onDelete(recipe.id)"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/30 transition cursor-pointer"
                        aria-label="Delete recipe">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-slate-400 font-medium text-sm">
                    No recipes found. Try a different search term.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesListComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly brandTitle = inject(ADMIN_BRAND_TOKEN, { optional: true }) || 'Admin Portal';

  protected readonly searchTerm = signal<string>('');

  protected readonly filteredRecipes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.recipeService.recipes();
    if (!term) return all;
    return all.filter(
      (r) => r.title.toLowerCase().includes(term) || r.category?.toLowerCase().includes(term),
    );
  });

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onDelete(id: string | number): void {
    if (confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      this.recipeService.deleteRecipe(id);
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
