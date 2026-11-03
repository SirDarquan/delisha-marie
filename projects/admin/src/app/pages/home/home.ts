import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateRecipeDialogComponent } from '../../components/create-recipe-dialog/create-recipe-dialog';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface HomeData {
  totalRecipes: number;
  recentRecipes: {
    id: string | number;
    title: string;
    category: string;
    prepTime: string;
    author: string;
  }[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 md:p-8">
      @if (showAdminView()) {
        <!-- Administrator Control Center Overview -->
        <div class="mb-8">
          <div
            class="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/20 shadow-2xl mb-8">
            <div class="flex items-center gap-3 mb-2">
              <span class="material-icons text-purple-400 text-3xl">admin_panel_settings</span>
              <h1 class="text-2xl font-black text-white">Administrator Control Center</h1>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed max-w-3xl">
              You are signed in as a Platform Administrator. Platform administrators manage member
              tenants, approve signups in the waiting room, and launch passwordless impersonation
              sessions into member sandboxes.
            </p>
            <div class="mt-6 flex flex-wrap gap-4">
              <a
                routerLink="/users"
                class="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg flex items-center gap-2 cursor-pointer">
                <span class="material-icons text-base">people</span>
                Open Users & Tenant Directory
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div class="flex justify-between items-center mb-3">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-wider"
                  >Tenant Isolation</span
                >
                <span class="material-icons text-emerald-400">shield</span>
              </div>
              <h3 class="text-base font-bold text-white mb-2">Sandboxed Member Content</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Recipes, taxonomy tags, contacts, and custom pages are strictly isolated by tenant.
                To view or edit recipes for Delisha Marie or Sir Darquan, launch an impersonation
                session from the users list.
              </p>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div class="flex justify-between items-center mb-3">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-wider"
                  >Waiting Room</span
                >
                <span class="material-icons text-amber-400">hourglass_top</span>
              </div>
              <h3 class="text-base font-bold text-white mb-2">Registration Gate</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                All newly registered accounts are held in pending status until you approve them as a
                Member with an isolated tenant or as an Administrator.
              </p>
            </div>
          </div>
        </div>
      } @else {
        <!-- Member (or Impersonating) Recipe Hub -->
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
            <p class="text-slate-500 text-xs mt-2 font-medium">Active dishes in this tenant</p>
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
              <button
                (click)="openCreateRecipeDialog()"
                class="inline-block w-full text-center py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer">
                + Create Recipe
              </button>
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
      }
    </div>
  `,
})
export class HomeComponent {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService, { optional: true });

  private readonly _homeResource = resource({
    loader: () => this.api.get<HomeData>('/home'),
  });

  readonly totalRecipes = computed(() => this._homeResource.value()?.totalRecipes ?? 0);
  readonly recentRecipes = computed(() => this._homeResource.value()?.recentRecipes ?? []);

  readonly isAdmin = computed(() => this.auth?.isAdmin() ?? false);
  readonly isImpersonating = computed(() => this.auth?.isImpersonating() ?? false);
  readonly showAdminView = computed(() => this.isAdmin() && !this.isImpersonating());

  openCreateRecipeDialog(): void {
    this.dialog.open(CreateRecipeDialogComponent);
  }
}
