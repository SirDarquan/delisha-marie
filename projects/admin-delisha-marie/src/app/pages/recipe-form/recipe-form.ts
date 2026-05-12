import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  ViewEncapsulation,
  InjectionToken,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';

export const RECIPE_FORM_BRAND_TOKEN = new InjectionToken<string>('recipeFormBrand');

@Component({
  selector: 'app-recipe-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <header class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1
            class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {{ brandTitle }}
          </h1>
          <p class="text-slate-400 text-sm font-medium mt-1">
            {{ isEdit() ? 'Edit Recipe' : 'New Recipe' }}
          </p>
        </div>
        <div>
          <a
            routerLink="/recipes"
            class="text-slate-300 hover:text-purple-400 transition text-sm font-semibold cursor-pointer">
            Back to Recipes
          </a>
        </div>
      </header>

      <main
        class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto backdrop-blur-md">
        <form
          [formGroup]="recipeForm"
          (ngSubmit)="onSubmit()"
          aria-label="Recipe details form"
          class="flex flex-col gap-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="title" class="text-xs font-semibold text-slate-300"
                >Title <span class="text-rose-400">*</span></label
              >
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="e.g., Creamy Tuscan Pasta"
                aria-required="true"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="slug" class="text-xs font-semibold text-slate-300"
                >Slug <span class="text-rose-400">*</span></label
              >
              <input
                id="slug"
                type="text"
                formControlName="slug"
                placeholder="e.g., creamy-tuscan-pasta"
                aria-required="true"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1">
              <label for="category" class="text-xs font-semibold text-slate-300">Category</label>
              <select
                id="category"
                formControlName="category"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white transition">
                <option value="" class="bg-slate-900">Select Category</option>
                <option value="Breakfast" class="bg-slate-900">Breakfast</option>
                <option value="Lunch" class="bg-slate-900">Lunch</option>
                <option value="Dinner" class="bg-slate-900">Dinner</option>
                <option value="Appetizer" class="bg-slate-900">Appetizer</option>
                <option value="Dessert" class="bg-slate-900">Dessert</option>
                <option value="Vegan" class="bg-slate-900">Vegan</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label for="difficulty" class="text-xs font-semibold text-slate-300"
                >Difficulty</label
              >
              <select
                id="difficulty"
                formControlName="difficulty"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white transition">
                <option value="Easy" class="bg-slate-900">Easy</option>
                <option value="Intermediate" class="bg-slate-900">Intermediate</option>
                <option value="Advanced" class="bg-slate-900">Advanced</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label for="prepTime" class="text-xs font-semibold text-slate-300">Prep Time</label>
              <input
                id="prepTime"
                type="text"
                formControlName="prepTime"
                placeholder="e.g., 15 mins"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1">
              <label for="cookTime" class="text-xs font-semibold text-slate-300">Cook Time</label>
              <input
                id="cookTime"
                type="text"
                formControlName="cookTime"
                placeholder="e.g., 20 mins"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1">
              <label for="totalTime" class="text-xs font-semibold text-slate-300">Total Time</label>
              <input
                id="totalTime"
                type="text"
                formControlName="totalTime"
                placeholder="e.g., 35 mins"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1">
              <label for="yield" class="text-xs font-semibold text-slate-300">Yield</label>
              <input
                id="yield"
                type="text"
                formControlName="yield"
                placeholder="e.g., 4 servings"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="image" class="text-xs font-semibold text-slate-300">Image URL</label>
              <input
                id="image"
                type="text"
                formControlName="image"
                placeholder="e.g., /images/recipes/pasta.png"
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="description" class="text-xs font-semibold text-slate-300"
                >Brief Description</label
              >
              <textarea
                id="description"
                formControlName="description"
                rows="2"
                placeholder="Brief summary of the recipe..."
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="content" class="text-xs font-semibold text-slate-300"
                >Full Content/Story (HTML or Text)</label
              >
              <textarea
                id="content"
                formControlName="content"
                rows="4"
                placeholder="Detailed story or description..."
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="ingredients" class="text-xs font-semibold text-slate-300"
                >Ingredients (One per line)</label
              >
              <textarea
                id="ingredients"
                formControlName="ingredients"
                rows="4"
                placeholder="Enter ingredients..."
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label for="instructions" class="text-xs font-semibold text-slate-300"
                >Instructions (One per line)</label
              >
              <textarea
                id="instructions"
                formControlName="instructions"
                rows="4"
                placeholder="Enter instructions..."
                class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-5 border-t border-slate-800/60 mt-2">
            <button
              mat-stroked-button
              type="button"
              (click)="onCancel()"
              class="border-slate-700 text-slate-300 hover:bg-slate-800 transition px-5 py-2.5 rounded-xl cursor-pointer">
              Cancel
            </button>
            <button
              mat-raised-button
              type="submit"
              [disabled]="recipeForm.invalid"
              class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isEdit() ? 'Update Recipe' : 'Save Recipe' }}
            </button>
          </div>
        </form>
      </main>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly recipeService = inject(RecipeService);
  protected readonly brandTitle =
    inject(RECIPE_FORM_BRAND_TOKEN, { optional: true }) || 'Admin Portal';

  protected readonly isEdit = signal<boolean>(false);
  private readonly idToEdit = signal<string | number | null>(null);

  protected readonly recipeForm = this.fb.group({
    title: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    category: [''],
    difficulty: ['Easy'],
    prepTime: [''],
    cookTime: [''],
    totalTime: [''],
    yield: [''],
    image: [''],
    description: [''],
    content: [''],
    ingredients: [''],
    instructions: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.idToEdit.set(id);
      const recipe = this.recipeService.getRecipeByIdOrSlug(id);
      if (recipe) {
        this.recipeForm.patchValue({
          title: recipe.title,
          slug: recipe.slug,
          category: recipe.category || '',
          difficulty: recipe.difficulty || 'Easy',
          prepTime: recipe.prepTime || '',
          cookTime: recipe.cookTime || '',
          totalTime: recipe.totalTime || '',
          yield: recipe.yield || '',
          image: recipe.image || '',
          description: recipe.description || '',
          content: recipe.content || '',
          ingredients: recipe.ingredients ? recipe.ingredients.join('\n') : '',
          instructions: recipe.instructions ? recipe.instructions.join('\n') : '',
        });
      }
    }
  }

  onSubmit(): void {
    if (this.recipeForm.valid) {
      const f = this.recipeForm.value;

      const ingredients = f.ingredients
        ? f.ingredients
            .split('\n')
            .map((i) => i.trim())
            .filter(Boolean)
        : [];
      const instructions = f.instructions
        ? f.instructions
            .split('\n')
            .map((i) => i.trim())
            .filter(Boolean)
        : [];

      const payload: Omit<Recipe, 'id'> = {
        title: f.title || '',
        slug: f.slug || '',
        category: f.category || '',
        difficulty: f.difficulty || 'Easy',
        prepTime: f.prepTime || '',
        cookTime: f.cookTime || '',
        totalTime: f.totalTime || '',
        yield: f.yield || '',
        image: f.image || '',
        description: f.description || '',
        content: f.content || '',
        ingredients,
        instructions,
        author: 'Delisha Marie',
      };

      if (this.isEdit()) {
        const id = this.idToEdit();
        if (id) {
          this.recipeService.updateRecipe(id, payload);
        }
      } else {
        this.recipeService.createRecipe(payload);
      }

      this.router.navigate(['/recipes']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }
}
