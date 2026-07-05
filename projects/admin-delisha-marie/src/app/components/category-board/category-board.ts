import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CategoryTrails,
  getCleanRecipeUrl,
  trimLeadingSlashes,
  trimSlashes,
  trimTrailingSlashes,
} from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

interface CategoryConfig {
  name: string;
  url: string;
  children?: { name: string; url: string }[];
}

@Component({
  selector: 'app-category-board',
  imports: [CommonModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- 1. THE BOARD (Capsules Trail) -->
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <span class="text-xs font-semibold text-slate-300">Active Category Board</span>

          <!-- Trail Selector Tabs -->
          <div class="flex flex-wrap gap-2 items-center">
            @for (trail of boardPiecesList(); track $index; let i = $index) {
              <div class="flex items-center">
                <button
                  type="button"
                  (click)="switchTrail(i)"
                  class="px-4 py-1.5 text-xs font-bold rounded-full transition border cursor-pointer flex items-center gap-1"
                  [class.bg-purple-600]="activeTrailIndex() === i"
                  [class.border-purple-500]="activeTrailIndex() === i"
                  [class.text-white]="activeTrailIndex() === i"
                  [class.bg-slate-800/60]="activeTrailIndex() !== i"
                  [class.border-slate-700/60]="activeTrailIndex() !== i"
                  [class.text-slate-300]="activeTrailIndex() !== i"
                  [class.hover:border-purple-400]="activeTrailIndex() !== i">
                  <span>Trail {{ i + 1 }}</span>
                  @if (i > 0) {
                    <span
                      class="material-icons text-xs hover:text-rose-400 cursor-pointer ml-1 leading-none"
                      role="button"
                      tabindex="0"
                      (click)="deleteTrail(i, $event)"
                      (keydown.enter)="deleteTrail(i, $event)">
                      close
                    </span>
                  }
                </button>
              </div>
            }
            <button
              type="button"
              (click)="addNewTrail()"
              class="px-3 py-1.5 text-[10px] font-bold rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1 shadow-sm leading-none">
              <span class="material-icons text-xs">add</span>
              New Trail
            </button>
          </div>
        </div>
        <div
          class="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-inner flex flex-wrap items-center gap-3 min-h-[90px] backdrop-blur-md">
          @for (piece of boardPieces(); track piece.url; let i = $index; let last = $last) {
            <div class="flex items-center gap-2">
              <div
                class="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-slate-100 text-sm font-semibold rounded-2xl shadow-sm hover:brightness-110 transition group">
                <span>{{ piece.name }}</span>
                <span class="text-[10px] text-slate-400 font-medium font-mono"
                  >({{ piece.url }})</span
                >

                <!-- Can only remove items past base Home & Recipes pieces, and not the recipe leaf node -->
                @if (
                  piece.url !== '/' && piece.url !== '/recipes' && !piece.url.startsWith('/recipe/')
                ) {
                  <button
                    type="button"
                    (click)="removePiece(i)"
                    class="text-slate-400 hover:text-rose-400 cursor-pointer flex items-center transition border-0 bg-transparent p-0 leading-none">
                    <span class="material-icons text-sm">close</span>
                  </button>
                }
              </div>

              @if (!last) {
                <span class="material-icons text-slate-600 select-none">chevron_right</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- 2. QUICK-PICK PANELS -->
      <div class="bg-slate-800/20 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-5">
        <!-- Predefined Categories -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-400 text-lg">category</span>
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider"
              >Predefined Categories</span
            >
          </div>
          <div class="flex flex-wrap gap-2">
            @for (cat of categories(); track cat.url) {
              <button
                type="button"
                (click)="toggleCategory(cat)"
                class="px-4 py-2 text-xs font-bold rounded-xl border transition shadow-sm cursor-pointer"
                [class.bg-purple-600]="isPieceSelected(cat.url)"
                [class.border-purple-500]="isPieceSelected(cat.url)"
                [class.text-white]="isPieceSelected(cat.url)"
                [class.bg-slate-800/40]="!isPieceSelected(cat.url)"
                [class.border-slate-700/60]="!isPieceSelected(cat.url)"
                [class.text-slate-300]="!isPieceSelected(cat.url)"
                [class.hover:border-purple-400]="!isPieceSelected(cat.url)">
                {{ cat.name }}
              </button>
            }
          </div>
        </div>

        <!-- Predefined Subcategories (Dynamic) -->
        @if (availableSubcategories().length > 0) {
          <div class="flex flex-col gap-3 animate-fadeIn">
            <div class="flex items-center gap-2">
              <span class="material-icons text-pink-400 text-lg">subdirectory_arrow_right</span>
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wider"
                >Available Subcategories</span
              >
            </div>
            <div class="flex flex-wrap gap-2">
              @for (sub of availableSubcategories(); track sub.url) {
                <button
                  type="button"
                  (click)="toggleSubcategory(sub)"
                  class="px-4 py-2 text-xs font-bold rounded-xl border transition shadow-sm cursor-pointer"
                  [class.bg-pink-600]="isPieceSelected(sub.url)"
                  [class.border-pink-500]="isPieceSelected(sub.url)"
                  [class.text-white]="isPieceSelected(sub.url)"
                  [class.bg-slate-800/40]="!isPieceSelected(sub.url)"
                  [class.border-slate-700/60]="!isPieceSelected(sub.url)"
                  [class.text-slate-300]="!isPieceSelected(sub.url)"
                  [class.hover:border-pink-400]="!isPieceSelected(sub.url)">
                  {{ sub.name }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- 3. ADD CUSTOM PIECE PANEL -->
      <div
        [class.opacity-50]="!isCustomPanelActive()"
        class="bg-slate-800/20 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-4 transition relative">
        @if (!isCustomPanelActive()) {
          <div
            class="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/65 backdrop-blur-[1.5px] rounded-2xl">
            <span
              class="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-lg uppercase tracking-wide">
              No further subpaths allowed under subcategories
            </span>
          </div>
        }

        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-400 text-lg">add_box</span>
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider"
            >Add Custom Pathway</span
          >
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="custom-name" class="text-[10px] font-semibold text-slate-400 uppercase"
              >Display Name</label
            >
            <input
              id="custom-name"
              type="text"
              [value]="customName()"
              (input)="updateCustomName($event)"
              (keydown.enter)="$event.preventDefault(); addCustomPiece()"
              [disabled]="!isCustomPanelActive()"
              placeholder="e.g., Summer Recipes"
              class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          <div class="flex flex-col gap-1">
            <label for="custom-url" class="text-[10px] font-semibold text-slate-400 uppercase"
              >Navigation URL</label
            >
            <div
              [class.opacity-50]="!isCustomPanelActive()"
              class="flex items-center bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2 text-xs focus-within:border-purple-400 transition">
              <span class="text-slate-500 select-none whitespace-nowrap">{{
                currentUrlPrefix()
              }}</span
              ><input
                id="custom-url"
                type="text"
                [value]="customUrl()"
                (input)="updateCustomUrl($event)"
                (keydown.enter)="$event.preventDefault(); addCustomPiece()"
                [disabled]="!isCustomPanelActive()"
                placeholder="summer"
                class="bg-transparent border-0 p-0 text-xs focus:outline-none text-white placeholder-slate-500 transition w-full disabled:cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-1">
          <button
            type="button"
            (click)="addCustomPiece()"
            [disabled]="
              !isCustomPanelActive() || !customName().trim() || customUrl().trim().length < 3
            "
            class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md cursor-pointer border-0 flex items-center gap-1">
            <span class="material-icons text-sm">add</span>
            Add to Board
          </button>
        </div>
      </div>

      <!-- 4. READONLY PREVIEW -->
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-slate-400 uppercase"
          >Compiled Category Pathway Preview</span
        >
        <input
          type="text"
          readonly
          [value]="compiledPreview()"
          class="bg-slate-950/80 border border-slate-800/80 text-slate-400 rounded-xl px-4 py-3 text-xs font-medium cursor-default focus:outline-none select-all" />
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBoardComponent implements FormValueControl<CategoryTrails | null> {
  private readonly recipeService = inject(RecipeService);

  // Dynamically compile categories and subcategories from the predefined database categories
  readonly categories = computed<CategoryConfig[]>(() => {
    const dbCategories = this.recipeService.categories() || [];
    const map = new Map<string, { url: string; subs: Map<string, string> }>();

    dbCategories.forEach((cat) => {
      if (!cat.url.startsWith('/recipes/')) return;

      const parts = cat.url.split('/').filter(Boolean);
      if (parts.length === 2) {
        // Base category
        if (map.has(cat.name)) {
          map.get(cat.name)!.url = cat.url;
        } else {
          map.set(cat.name, { url: cat.url, subs: new Map<string, string>() });
        }
      } else if (parts.length === 3) {
        // Subcategory
        const parentUrl = `/${parts[0]}/${parts[1]}`;
        const parent = dbCategories.find((c) => c.url === parentUrl);
        if (parent) {
          if (!map.has(parent.name)) {
            map.set(parent.name, { url: parent.url, subs: new Map<string, string>() });
          }
          map.get(parent.name)!.subs.set(cat.name, cat.url);
        }
      }
    });

    const result: CategoryConfig[] = [];
    map.forEach((data, catName) => {
      const children = Array.from(data.subs.entries()).map(([subName, subUrl]) => ({
        name: subName,
        url: subUrl,
      }));

      result.push({
        name: catName,
        url: data.url,
        children: children.length > 0 ? children : undefined,
      });
    });

    // Sort categories alphabetically for a premium UI presentation
    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Standalone value model for signals form integration
  readonly value = model<CategoryTrails | null>(null);
  readonly required = input<boolean>(false);

  // Standalone Inputs
  recipeTitle = input<string>('');
  recipeSlug = input<string>('');

  // Standalone Outputs
  categoryChange = output<CategoryTrails>();

  // Board reactive pieces state (defaults to Home & Recipes)
  boardPiecesList = signal<{ name: string; url: string }[][]>([
    [
      { name: 'Home', url: '/' },
      { name: 'Recipes', url: '/recipes' },
    ],
  ]);

  activeTrailIndex = signal<number>(0);

  // boardPieces computed signal acts as a proxy for the active trail
  readonly boardPieces = computed(() => {
    const idx = this.activeTrailIndex();
    const list = this.boardPiecesList();
    const trail = list[idx] ||
      list[0] || [
        { name: 'Home', url: '/' },
        { name: 'Recipes', url: '/recipes' },
      ];

    const title = this.recipeTitle() || 'Untitled';
    const slug = this.recipeSlug();
    if (slug) {
      const recipeUrl = getCleanRecipeUrl(slug);
      const filtered = trail.filter((p) => !p.url.startsWith('/recipe/'));
      return [...filtered, { name: title, url: recipeUrl }];
    }

    return trail;
  });

  // Form input signal values
  customName = signal<string>('');
  customUrl = signal<string>('');

  constructor() {
    // Automatically load incoming category structures when initialized
    effect(() => {
      const initial = this.value();
      if (initial?.trails) {
        // Extract standard trails (starts with Home and Recipes, url not matching auto-generated paths)
        const standardTrails = initial.trails.filter((trail) => {
          if (trail.length === 0) return false;
          return trail[0]?.url === '/' && trail[1]?.url === '/recipes';
        });

        if (standardTrails.length > 0) {
          // Fill in missing intermediate category nodes (e.g. if the trail jumps from Recipes directly to a subcategory)
          const dbCategories = this.recipeService.categories() || [];
          const expandedStandardTrails = standardTrails.map((trail) => {
            const expandedTrail: { name: string; url: string }[] = [];
            for (const node of trail) {
              const urlPart = typeof node.url === 'string' ? node.url : '';
              const parts = urlPart.split('/').filter(Boolean);

              if (parts.length === 3 && parts[0] === 'recipes') {
                const parentUrl = `/${parts[0]}/${parts[1]}`;
                const hasParent =
                  expandedTrail.some((t) => t.url === parentUrl) ||
                  trail.some((t: { url: string }) => t.url === parentUrl);
                if (!hasParent) {
                  const parentCat = dbCategories.find(
                    (c: { url: string; name: string }) => c.url === parentUrl,
                  );
                  if (parentCat) {
                    expandedTrail.push({ name: parentCat.name, url: parentCat.url });
                  }
                }
              }

              expandedTrail.push({ name: node.name || '', url: urlPart });
            }
            return expandedTrail;
          });

          // Clean recipe leaf nodes before serialization comparison
          const cleanedInputTrails = expandedStandardTrails.map((trail) =>
            trail.filter((t) => t.url && !t.url.startsWith('/recipe/')),
          );

          const inputStr = JSON.stringify(cleanedInputTrails.map((t) => t.map((b) => b.url)));
          const currentStr = JSON.stringify(this.boardPiecesList().map((t) => t.map((p) => p.url)));

          // Only reload and reset active index if there is an external data change
          if (inputStr !== currentStr) {
            const mappedList = expandedStandardTrails.map((trail) =>
              trail
                .filter((b) => b.url && !b.url.startsWith('/recipe/'))
                .map((b) => ({
                  name: b.name,
                  url: b.url,
                })),
            );
            this.boardPiecesList.set(mappedList);
            this.activeTrailIndex.set(0);
          }
        }
      }
    });
  }

  switchTrail(idx: number): void {
    this.activeTrailIndex.set(idx);
  }

  addNewTrail(): void {
    const nextIndex = this.boardPiecesList().length;
    const baseTrail = [
      { name: 'Home', url: '/' },
      { name: 'Recipes', url: '/recipes' },
    ];

    // Set the new trail index as active
    this.activeTrailIndex.set(nextIndex);

    // Append the new trail to the list
    this.boardPiecesList.update((list) => [...list, baseTrail]);

    this.syncValueAndEmit();
  }

  deleteTrail(idx: number, event: Event): void {
    event.stopPropagation(); // Avoid switching tabs on delete click
    const list = this.boardPiecesList();
    if (idx === 0 || list.length <= 1) return;

    this.boardPiecesList.update((l) => l.filter((_, i) => i !== idx));

    // Shift active index if it was deleted or out of bounds
    if (this.activeTrailIndex() >= this.boardPiecesList().length) {
      this.activeTrailIndex.set(this.boardPiecesList().length - 1);
    }

    // Trigger update and emit
    this.updateBoard(this.boardPiecesList()[this.activeTrailIndex()]);
  }

  isPieceSelected(url: string): boolean {
    return this.boardPieces().some((p) => p.url === url);
  }

  toggleCategory(cat: CategoryConfig): void {
    const all = this.boardPieces();
    const isAlreadySelected = all.some((p) => p.url === cat.url);

    if (isAlreadySelected) {
      // Toggle off: remove this category and any predefined subcategory
      const filtered = all.filter((p) => {
        const isCat = p.url === cat.url;
        const isSub = this.categories().some((c) => c.children?.some((sub) => sub.url === p.url));
        return !isCat && !isSub;
      });
      this.updateBoard(filtered);
    } else {
      // Selecting a new category: replace any existing category and remove any subcategory
      const filtered = all.filter((p) => {
        const isAnyCat = this.categories().some((c) => c.url === p.url);
        const isAnySub = this.categories().some((c) =>
          c.children?.some((sub) => sub.url === p.url),
        );
        return !isAnyCat && !isAnySub;
      });
      this.updateBoard([...filtered, { name: cat.name, url: cat.url }]);
    }
  }

  toggleSubcategory(sub: { name: string; url: string }): void {
    const all = this.boardPieces();
    const isAlreadySelected = all.some((p) => p.url === sub.url);

    if (isAlreadySelected) {
      // Toggle off: remove this subcategory
      const filtered = all.filter((p) => p.url !== sub.url);
      this.updateBoard(filtered);
    } else {
      // Selecting a new subcategory: replace any existing subcategory first
      const filtered = all.filter((p) => {
        const isAnySub = this.categories().some((c) => c.children?.some((s) => s.url === p.url));
        return !isAnySub;
      });
      this.updateBoard([...filtered, { name: sub.name, url: sub.url }]);
    }
  }

  addCustomPiece(): void {
    const name = this.customName().trim();
    let urlPart = this.customUrl().trim();
    const prefix = this.currentUrlPrefix();

    // Dynamically clean redundancy matching the current prefix
    const prefixNoSlashes = trimSlashes(prefix);
    if (prefixNoSlashes) {
      const regex = new RegExp('^/?' + prefixNoSlashes + '/?', 'i');
      urlPart = urlPart.replace(regex, '');
    }

    // Clean of general "/recipes", leading/trailing slashes
    urlPart = trimTrailingSlashes(trimLeadingSlashes(urlPart.replace(/^\/?recipes\/?/i, '')));

    if (!name || urlPart.length < 3) return;

    const fullUrl = `${prefix}${urlPart}`;
    const all = this.boardPieces();
    this.updateBoard([...all, { name, url: fullUrl }]);

    this.customName.set('');
    this.customUrl.set('');
  }

  removePiece(idx: number): void {
    const all = this.boardPieces();
    // Do not remove base pieces
    if (idx < 2) return;

    const removedPiece = all[idx];
    const isCategory = this.categories().some((c) => c.url === removedPiece.url);

    if (isCategory) {
      // If we remove the category capsule directly, also remove the subcategory
      const filtered = all.filter((p, i) => {
        if (i === idx) return false;
        const isSub = this.categories().some((c) => c.children?.some((sub) => sub.url === p.url));
        return !isSub;
      });
      this.updateBoard(filtered);
    } else {
      this.updateBoard(all.filter((_, i) => i !== idx));
    }
  }

  updateCustomName(event: Event): void {
    this.customName.set((event.target as HTMLInputElement).value);
  }

  updateCustomUrl(event: Event): void {
    let value = (event.target as HTMLInputElement).value;
    const prefix = this.currentUrlPrefix();

    // Strip redundant active prefix if matching
    const prefixNoSlashes = trimSlashes(prefix);
    if (prefixNoSlashes) {
      const regex = new RegExp('^/?' + prefixNoSlashes + '/?', 'i');
      value = value.replace(regex, '');
    }

    // Strip leading "/recipes", "recipes", and any leading slashes
    value = trimLeadingSlashes(value.replace(/^\/?recipes\/?/i, ''));

    this.customUrl.set(value);
    (event.target as HTMLInputElement).value = value;
  }

  updateBoard(newPieces: { name: string; url: string }[]): void {
    // Strip recipe piece from internal list state
    const withoutRecipe = newPieces.filter((p) => !p.url.startsWith('/recipe/'));

    // Update active trail inside list
    this.boardPiecesList.update((list) => {
      const newList = [...list];
      newList[this.activeTrailIndex()] = withoutRecipe;
      return newList;
    });

    this.syncValueAndEmit();
  }

  private syncValueAndEmit(): void {
    const trails = this.boardPiecesList().map((trail) => {
      const title = this.recipeTitle() || 'Untitled';
      const slug = this.recipeSlug();
      if (slug) {
        const recipeUrl = getCleanRecipeUrl(slug);
        return [...trail, { name: title, url: recipeUrl }];
      }
      return trail;
    });

    const hasCategory = trails.some((t) => t.length > 2);
    if (hasCategory) {
      this.value.set({ trails });
    } else {
      this.value.set(null);
    }

    this.categoryChange.emit({ trails });
  }

  // Dynamic navigation url prefix calculation based on active trail
  readonly currentUrlPrefix = computed(() => {
    const pieces = this.boardPieces();
    if (pieces.length === 0) return '/';

    const nonRecipe = pieces.filter((p) => !p.url.startsWith('/recipe/'));
    if (nonRecipe.length === 0) return '/';

    const last = nonRecipe.at(-1);
    const base = last?.url || '';
    return base.endsWith('/') ? base : `${base}/`;
  });

  // Determines if the custom pathway piece panel should be active
  readonly isCustomPanelActive = computed(() => {
    const pieces = this.boardPieces();
    if (pieces.length === 0) return false;

    const nonRecipe = pieces.filter((p) => !p.url.startsWith('/recipe/'));
    if (nonRecipe.length === 0) return false;

    const last = nonRecipe.at(-1);

    // Check if the last piece matches a predefined subcategory URL
    const isPredefinedSub = this.categories().some((c) =>
      c.children?.some((sub) => sub.url === last?.url),
    );

    return !isPredefinedSub;
  });

  // Reactive subcategories list calculation
  readonly availableSubcategories = computed(() => {
    const trail = this.boardPieces();
    if (trail.length === 0) return [];

    // Traverse board trail backwards to find last matched category config
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      const cat = this.categories().find((c) => c.url === p.url);
      if (cat?.children) {
        return cat.children;
      }
    }
    return [];
  });

  // Dynamic preview text generator
  readonly compiledPreview = computed(() => {
    return this.boardPieces()
      .map((p) => `${p.name} (${p.url})`)
      .join('  ➔  ');
  });
}
