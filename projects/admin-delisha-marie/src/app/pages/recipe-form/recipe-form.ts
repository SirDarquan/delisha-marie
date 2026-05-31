import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { form, FormRoot, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';
import { BreadcrumbBoardComponent } from '../../components/breadcrumb-board/breadcrumb-board';
import { CookingMethodSelectorComponent } from '../../components/cooking-method-selector/cooking-method-selector';
import { SpecialDietsSelectorComponent } from '../../components/special-diets-selector/special-diets-selector';
import { HolidaysSelectorComponent } from '../../components/holidays-selector/holidays-selector';
import { Breadcrumbs, Nutrition, isStandardTrail, slugify } from '@dm/library';

interface RecipeFormModel {
  title: string;
  slug: string;
  author: string;
  category: string;
  difficulty: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  yield: string;
  status: 'draft' | 'scheduled' | 'published' | 'updated';
  preview_token: string;
  image: string;
  imageWidth: string;
  imageHeight: string;
  imageType: string;
  description: string;
  content: string;
  ingredients: string;
  instructions: string;
  method: string;
  theBest: boolean;
  holidays: string;
  specialDiets: string[];
  breadcrumbs: Breadcrumbs | null;
  cuisine: string;
  course: string;
  keywords: string;
  equipment: string;
  notes: string;
  servingSize: string;
  calories: string;
  fat: string;
  carbohydrates: string;
  protein: string;
  fiber: string;
  sugar: string;
  sodium: string;
  cholesterol: string;
  saturatedFat: string;
}

@Component({
  selector: 'app-recipe-form',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    BreadcrumbBoardComponent,
    CookingMethodSelectorComponent,
    SpecialDietsSelectorComponent,
    HolidaysSelectorComponent,
  ],
  template: `
    <div class="p-4 md:p-8">
      <div class="mb-6 max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">
            {{ isEdit() ? 'Edit Recipe' : 'New Recipe' }}
          </h1>
          <p class="text-slate-400 text-xs font-medium mt-1">
            Fill in the fields below to publish a recipe
          </p>
        </div>
        <a
          routerLink="/recipes"
          class="text-slate-300 hover:text-purple-400 transition text-sm font-semibold cursor-pointer flex items-center gap-1">
          <span class="material-icons text-sm">arrow_back</span> Back to Recipes
        </a>
      </div>

      <!-- Tab bar -->
      <div class="flex justify-center mb-6 max-w-4xl mx-auto">
        <div
          class="relative bg-slate-800 border border-slate-700 rounded-full p-1.5 flex gap-2 shadow-inner backdrop-blur-md">
          <!-- Sliding background pill -->
          <div
            class="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
            [style.left.px]="activeTab() === 'what' ? 6 : 146"
            [style.width.px]="140"></div>

          <!-- Tab 1 Button -->
          <button
            type="button"
            (click)="activeTab.set('what')"
            class="relative z-10 w-[140px] h-10 text-xs font-bold rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer border-0 bg-transparent text-center"
            [class.text-white]="activeTab() === 'what'"
            [class.text-slate-400]="activeTab() !== 'what'">
            <span class="material-icons text-sm">restaurant_menu</span>
            What is it
          </button>

          <!-- Tab 2 Button -->
          <button
            type="button"
            (click)="activeTab.set('where')"
            class="relative z-10 w-[140px] h-10 text-xs font-bold rounded-full transition-colors duration-300 focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer border-0 bg-transparent text-center"
            [class.text-white]="activeTab() === 'where'"
            [class.text-slate-400]="activeTab() !== 'where'">
            <span class="material-icons text-sm">explore</span>
            Where is it
          </button>
        </div>
      </div>

      <main
        class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto backdrop-blur-md">
        <form
          [formRoot]="recipeForm"
          (change)="markDirty()"
          (input)="markDirty()"
          aria-label="Recipe details form"
          class="flex flex-col gap-6">
          <!-- 1. WHAT IS IT Tab -->
          @if (activeTab() === 'what') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="title" class="text-xs font-semibold text-slate-300"
                  >Title <span class="text-rose-400">*</span></label
                >
                <input
                  id="title"
                  type="text"
                  [formField]="recipeForm.title"
                  placeholder="e.g., Creamy Tuscan Pasta"
                  aria-required="true"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
                @for (error of recipeForm.title().errors(); track error) {
                  <span class="text-rose-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <span class="material-icons text-[14px]">error_outline</span>
                    {{ error.message }}
                  </span>
                }
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="slug" class="text-xs font-semibold text-slate-300"
                  >Slug <span class="text-rose-400">*</span></label
                >
                <input
                  id="slug"
                  type="text"
                  [formField]="recipeForm.slug"
                  placeholder="e.g., creamy-tuscan-pasta"
                  aria-required="true"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
                @for (error of recipeForm.slug().errors(); track error) {
                  <span class="text-rose-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <span class="material-icons text-[14px]">error_outline</span>
                    {{ error.message }}
                  </span>
                }
              </div>

              <div class="flex flex-col gap-1">
                <label for="difficulty" class="text-xs font-semibold text-slate-300"
                  >Difficulty</label
                >
                <select
                  id="difficulty"
                  [formField]="recipeForm.difficulty"
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
                  [formField]="recipeForm.prepTime"
                  placeholder="e.g., 15 mins"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="cookTime" class="text-xs font-semibold text-slate-300">Cook Time</label>
                <input
                  id="cookTime"
                  type="text"
                  [formField]="recipeForm.cookTime"
                  placeholder="e.g., 20 mins"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="totalTime" class="text-xs font-semibold text-slate-300"
                  >Total Time</label
                >
                <input
                  id="totalTime"
                  type="text"
                  [formField]="recipeForm.totalTime"
                  placeholder="e.g., 35 mins"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="yield" class="text-xs font-semibold text-slate-300">Yield</label>
                <input
                  id="yield"
                  type="text"
                  [formField]="recipeForm.yield"
                  placeholder="e.g., 4 servings"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="author" class="text-xs font-semibold text-slate-300">Author</label>
                <input
                  id="author"
                  type="text"
                  [formField]="recipeForm.author"
                  placeholder="e.g., Delisha Marie"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="cuisine" class="text-xs font-semibold text-slate-300">Cuisine</label>
                <input
                  id="cuisine"
                  type="text"
                  [formField]="recipeForm.cuisine"
                  placeholder="e.g., Italian, Mexican"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="course" class="text-xs font-semibold text-slate-300">Course</label>
                <input
                  id="course"
                  type="text"
                  [formField]="recipeForm.course"
                  placeholder="e.g., Dinner, Breakfast"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="keywords" class="text-xs font-semibold text-slate-300"
                  >Keywords (Comma separated)</label
                >
                <input
                  id="keywords"
                  type="text"
                  [formField]="recipeForm.keywords"
                  placeholder="e.g., easy, pasta, dinner"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="image" class="text-xs font-semibold text-slate-300">Image URL</label>
                <input
                  id="image"
                  type="text"
                  [formField]="recipeForm.image"
                  placeholder="e.g., /images/recipes/pasta.png"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition" />
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="description" class="text-xs font-semibold text-slate-300"
                  >Brief Description</label
                >
                <textarea
                  id="description"
                  [formField]="recipeForm.description"
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
                  [formField]="recipeForm.content"
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
                  [formField]="recipeForm.ingredients"
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
                  [formField]="recipeForm.instructions"
                  rows="4"
                  placeholder="Enter instructions..."
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="equipment" class="text-xs font-semibold text-slate-300"
                  >Equipment (One per line)</label
                >
                <textarea
                  id="equipment"
                  [formField]="recipeForm.equipment"
                  rows="3"
                  placeholder="Enter equipment..."
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="notes" class="text-xs font-semibold text-slate-300"
                  >Recipe Notes (One per line)</label
                >
                <textarea
                  id="notes"
                  [formField]="recipeForm.notes"
                  rows="3"
                  placeholder="Enter recipe notes..."
                  class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-slate-500 transition resize-y"></textarea>
              </div>

              <!-- Nutritional Information -->
              <div class="flex flex-col gap-3 md:col-span-2 border-t border-slate-800/60 pt-4 mt-2">
                <h4 class="text-sm font-semibold text-white">Nutritional Information</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div class="flex flex-col gap-1">
                    <label for="servingSize" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Serving Size</label
                    >
                    <input
                      id="servingSize"
                      type="text"
                      [formField]="recipeForm.servingSize"
                      placeholder="e.g., 1 slice"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="calories" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Calories</label
                    >
                    <input
                      id="calories"
                      type="text"
                      [formField]="recipeForm.calories"
                      placeholder="e.g., 250 kcal"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="fat" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Fat</label
                    >
                    <input
                      id="fat"
                      type="text"
                      [formField]="recipeForm.fat"
                      placeholder="e.g., 12g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="saturatedFat" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Saturated Fat</label
                    >
                    <input
                      id="saturatedFat"
                      type="text"
                      [formField]="recipeForm.saturatedFat"
                      placeholder="e.g., 4g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="cholesterol" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Cholesterol</label
                    >
                    <input
                      id="cholesterol"
                      type="text"
                      [formField]="recipeForm.cholesterol"
                      placeholder="e.g., 15mg"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="sodium" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Sodium</label
                    >
                    <input
                      id="sodium"
                      type="text"
                      [formField]="recipeForm.sodium"
                      placeholder="e.g., 120mg"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label
                      for="carbohydrates"
                      class="text-[10px] font-bold text-slate-400 uppercase"
                      >Carbohydrates</label
                    >
                    <input
                      id="carbohydrates"
                      type="text"
                      [formField]="recipeForm.carbohydrates"
                      placeholder="e.g., 30g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="fiber" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Fiber</label
                    >
                    <input
                      id="fiber"
                      type="text"
                      [formField]="recipeForm.fiber"
                      placeholder="e.g., 3g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="sugar" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Sugar</label
                    >
                    <input
                      id="sugar"
                      type="text"
                      [formField]="recipeForm.sugar"
                      placeholder="e.g., 5g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="protein" class="text-[10px] font-bold text-slate-400 uppercase"
                      >Protein</label
                    >
                    <input
                      id="protein"
                      type="text"
                      [formField]="recipeForm.protein"
                      placeholder="e.g., 8g"
                      class="bg-slate-800/40 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- 2. WHERE IS IT Tab -->
          @if (activeTab() === 'where') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="category" class="text-xs font-semibold text-slate-300">Category</label>
                <select
                  id="category"
                  [formField]="recipeForm.category"
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

              <!-- Dynamic Stackable Breadcrumbs Board -->
              <div class="flex flex-col gap-1 md:col-span-2">
                <app-breadcrumb-board
                  [initialBreadcrumbs]="recipeModel().breadcrumbs"
                  [recipeTitle]="recipeModel().title"
                  [recipeSlug]="recipeModel().slug"
                  (breadcrumbsChange)="onBreadcrumbsChanged($event)">
                </app-breadcrumb-board>
              </div>

              <!-- Slide Toggle: Marked The Best -->
              <div
                class="flex flex-col gap-2 md:col-span-2 p-4 bg-slate-800/20 border border-slate-700/40 rounded-2xl">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-semibold text-white">Mark as "The Best"</h4>
                    <p class="text-xs text-slate-400 font-medium">
                      Include this recipe in the premium "The Best Recipes" collection
                    </p>
                  </div>
                  <mat-slide-toggle
                    [formField]="recipeForm.theBest"
                    [hideIcon]="true"
                    aria-label="Mark as The Best slide toggle">
                  </mat-slide-toggle>
                </div>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-cooking-method-selector
                  [initialMethod]="recipeModel().method"
                  (methodChange)="onMethodChanged($event)">
                </app-cooking-method-selector>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-holidays-selector
                  [initialHoliday]="recipeModel().holidays"
                  (holidayChange)="onHolidayChanged($event)">
                </app-holidays-selector>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-special-diets-selector
                  [initialDiets]="recipeModel().specialDiets"
                  (dietsChange)="onSpecialDietsChanged($event)">
                </app-special-diets-selector>
              </div>
            </div>
          }

          <div
            class="flex flex-wrap justify-end items-center gap-3 pt-5 border-t border-slate-800/60 mt-2">
            <button
              matButton="outlined"
              type="button"
              (click)="onCancel()"
              class="border-slate-700 text-slate-300 hover:bg-slate-800 transition px-5 py-2.5 rounded-xl cursor-pointer">
              Cancel
            </button>

            <!-- State 1: Creating a new recipe or current status is 'draft' -->
            @if (!isEdit() || currentStatus() === 'draft') {
              <button
                mat-stroked-button
                type="button"
                [disabled]="isDraftDisabled()"
                (click)="saveDraft()"
                class="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                Save as Draft
              </button>
              <button
                mat-stroked-button
                type="submit"
                [disabled]="recipeForm().invalid() || !isDirty()"
                (click)="saveRequired('scheduled')"
                class="px-5 py-2.5 rounded-xl font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0">
                Schedule Publication
              </button>
            }

            <!-- State 2: Recipe is 'scheduled' (PrePublished) -->
            @if (isEdit() && currentStatus() === 'scheduled') {
              <button
                mat-stroked-button
                type="button"
                [disabled]="isDraftDisabled()"
                (click)="saveDraft()"
                class="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                Revert to Draft
              </button>
              <button
                mat-stroked-button
                type="submit"
                [disabled]="recipeForm().invalid() || !isDirty()"
                (click)="saveRequired('scheduled')"
                class="px-5 py-2.5 rounded-xl font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0">
                Update Schedule
              </button>
            }

            <!-- State 3: Recipe is 'published' or 'updated' -->
            @if (isEdit() && (currentStatus() === 'published' || currentStatus() === 'updated')) {
              <button
                mat-stroked-button
                type="button"
                [disabled]="true"
                class="px-5 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-800/40 border border-slate-700/30 opacity-40 cursor-not-allowed">
                Revert to Draft
              </button>
              <button
                mat-stroked-button
                type="button"
                [disabled]="true"
                class="px-5 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-800/40 border border-slate-700/30 opacity-40 cursor-not-allowed">
                Schedule
              </button>
              <button
                mat-stroked-button
                type="submit"
                [disabled]="recipeForm().invalid() || !isDirty()"
                (click)="saveRequired('published')"
                class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0">
                Update Published
              </button>
            }
          </div>
        </form>
      </main>
    </div>
  `,
  styles: [
    `
      .animate-fadeIn {
        animation: fadeIn 0.35s ease-out forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
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
export class RecipeFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly recipeService = inject(RecipeService);

  protected readonly isEdit = signal<boolean>(false);
  private readonly idToEdit = signal<string | number | null>(null);

  // active view state toggling
  protected readonly activeTab = signal<'what' | 'where'>('what');

  // Track draft changes state
  protected readonly isDirty = signal<boolean>(false);
  private isInitialized = false;
  protected readonly isDraftDisabled = computed(() => !this.isDirty());

  // Modern Signal-based Form state
  protected readonly recipeModel = signal<RecipeFormModel>({
    title: '',
    slug: '',
    author: 'Delisha Marie',
    category: '',
    difficulty: 'Easy',
    prepTime: '',
    cookTime: '',
    totalTime: '',
    yield: '',
    status: 'draft',
    preview_token: '',
    image: '',
    imageWidth: '',
    imageHeight: '',
    imageType: '',
    description: '',
    content: '',
    ingredients: '',
    instructions: '',
    method: '',
    theBest: false,
    holidays: '',
    specialDiets: [],
    breadcrumbs: null,
    cuisine: '',
    course: '',
    keywords: '',
    equipment: '',
    notes: '',
    servingSize: '',
    calories: '',
    fat: '',
    carbohydrates: '',
    protein: '',
    fiber: '',
    sugar: '',
    sodium: '',
    cholesterol: '',
    saturatedFat: '',
  });

  protected readonly currentStatus = computed(() => this.recipeModel().status);

  protected readonly recipeForm = form(
    this.recipeModel,
    (fields) => {
      required(fields.title, { message: 'Title is required' });
      required(fields.slug, { message: 'Slug is required' });
      if (this.currentStatus() !== 'draft') {
        required(fields.category, { message: 'Category is required' });
        // required(fields.subcategory, { message: 'Subcategory is required' });
        required(fields.difficulty, { message: 'Difficulty is required' });
        required(fields.prepTime, { message: 'Prep time is required' });
        required(fields.cookTime, { message: 'Cook time is required' });
        required(fields.totalTime, { message: 'Total time is required' });
        required(fields.yield, { message: 'Yield is required' });
        // required(fields.status, { message: 'Status is required' });
        required(fields.image, { message: 'Image is required' });
        required(fields.description, { message: 'Description is required' });
        required(fields.content, { message: 'Content is required' });
        required(fields.ingredients, { message: 'Ingredients is required' });
        required(fields.instructions, { message: 'Instructions is required' });
        required(fields.method, { message: 'Method is required' });
        required(fields.theBest, { message: 'The best is required' });
        required(fields.breadcrumbs, { message: 'Breadcrumbs is required' });
      }
    },
    {
      submission: {
        action: async () => {
          const targetStatus =
            this.currentStatus() === 'published' || this.currentStatus() === 'updated'
              ? 'published'
              : 'scheduled';
          this.saveRequired(targetStatus);
        },
      },
    },
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.idToEdit.set(id);
      const recipe = this.recipeService.getRecipeByIdOrSlug(id);
      if (recipe) {
        this.recipeModel.set({
          title: recipe.title || '',
          slug: recipe.slug || '',
          author: recipe.author || 'Delisha Marie',
          category: recipe.category || '',
          difficulty: recipe.difficulty || 'Easy',
          prepTime: recipe.prepTime || '',
          cookTime: recipe.cookTime || '',
          totalTime: recipe.totalTime || '',
          yield: recipe.yield || '',
          status: (recipe.status as 'draft' | 'scheduled' | 'published' | 'updated') || 'draft',
          preview_token: recipe.preview_token || '',
          image: recipe.image || '',
          imageWidth: recipe.imageWidth || '',
          imageHeight: recipe.imageHeight || '',
          imageType: recipe.imageType || '',
          description: recipe.description || '',
          content: recipe.content || '',
          ingredients: recipe.ingredients ? recipe.ingredients.join('\n') : '',
          instructions: recipe.instructions ? recipe.instructions.join('\n') : '',
          method: recipe.method || '',
          theBest: recipe.theBest || false,
          holidays: recipe.holidays && recipe.holidays[0] ? recipe.holidays[0] : '',
          specialDiets: recipe.specialDiets || [],
          breadcrumbs: recipe.breadcrumbs || null,
          cuisine: recipe.cuisine || '',
          course: recipe.course || '',
          keywords: recipe.keywords ? recipe.keywords.join(', ') : '',
          equipment: recipe.equipment ? recipe.equipment.join('\n') : '',
          notes: recipe.notes ? recipe.notes.join('\n') : '',
          servingSize: recipe.nutrition?.servingSize || '',
          calories: recipe.nutrition?.calories || '',
          fat: recipe.nutrition?.fat || '',
          carbohydrates: recipe.nutrition?.carbohydrates || '',
          protein: recipe.nutrition?.protein || '',
          fiber: recipe.nutrition?.fiber || '',
          sugar: recipe.nutrition?.sugar || '',
          sodium: recipe.nutrition?.sodium || '',
          cholesterol: recipe.nutrition?.cholesterol || '',
          saturatedFat: recipe.nutrition?.saturatedFat || '',
        });
      }
    }
    setTimeout(() => {
      this.isInitialized = true;
    }, 0);
  }

  markDirty(): void {
    if (this.isInitialized) {
      this.isDirty.set(true);
    }
  }

  onBreadcrumbsChanged(b: Breadcrumbs): void {
    this.recipeModel.update((model) => ({
      ...model,
      breadcrumbs: b,
    }));
    this.markDirty();
  }

  onMethodChanged(method: string): void {
    this.recipeModel.update((model) => ({
      ...model,
      method,
    }));
    this.markDirty();
  }

  onSpecialDietsChanged(specialDiets: string[]): void {
    this.recipeModel.update((model) => ({
      ...model,
      specialDiets,
    }));
    this.markDirty();
  }

  onHolidayChanged(holidays: string): void {
    this.recipeModel.update((model) => ({
      ...model,
      holidays,
    }));
    this.markDirty();
  }

  private serializeRecipe(
    formValue: RecipeFormModel,
    status: 'draft' | 'scheduled' | 'published',
  ): Omit<Recipe, 'id'> {
    const ingredients = formValue.ingredients
      ? formValue.ingredients
          .split('\n')
          .map((i) => i.trim())
          .filter(Boolean)
      : [];
    const instructions = formValue.instructions
      ? formValue.instructions
          .split('\n')
          .map((i) => i.trim())
          .filter(Boolean)
      : [];
    const equipment = formValue.equipment
      ? formValue.equipment
          .split('\n')
          .map((e) => e.trim())
          .filter(Boolean)
      : [];
    const notes = formValue.notes
      ? formValue.notes
          .split('\n')
          .map((n) => n.trim())
          .filter(Boolean)
      : [];
    const keywords = formValue.keywords
      ? formValue.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];
    const holidays = formValue.holidays ? [formValue.holidays] : [];
    const specialDiets = formValue.specialDiets || [];

    const nutrition: Nutrition | undefined =
      formValue.servingSize ||
      formValue.calories ||
      formValue.fat ||
      formValue.carbohydrates ||
      formValue.protein ||
      formValue.fiber ||
      formValue.sugar ||
      formValue.sodium ||
      formValue.cholesterol ||
      formValue.saturatedFat
        ? {
            servingSize: formValue.servingSize || '',
            calories: formValue.calories || '',
            fat: formValue.fat || '',
            carbohydrates: formValue.carbohydrates || '',
            protein: formValue.protein || '',
            fiber: formValue.fiber || '',
            sugar: formValue.sugar || '',
            sodium: formValue.sodium || '',
            cholesterol: formValue.cholesterol || '',
            saturatedFat: formValue.saturatedFat || '',
          }
        : undefined;

    return {
      title: formValue.title || '',
      slug: formValue.slug || '',
      category: formValue.category || '',
      difficulty: formValue.difficulty || 'Easy',
      prepTime: formValue.prepTime || '',
      cookTime: formValue.cookTime || '',
      totalTime: formValue.totalTime || '',
      yield: formValue.yield || '',
      image: formValue.image || '',
      description: formValue.description || '',
      content: formValue.content || '',
      ingredients,
      instructions,
      author: formValue.author || 'Delisha Marie',
      status,
      preview_token: formValue.preview_token || '',
      method: formValue.method || '',
      theBest: formValue.theBest || false,
      holidays,
      specialDiets,
      breadcrumbs: this.getBreadcrumbsPayload(
        this.recipeModel().breadcrumbs,
        this.recipeModel().theBest,
        this.recipeModel().method,
        specialDiets,
        holidays,
      ),
      cuisine: formValue.cuisine || '',
      course: formValue.course || '',
      nutrition,
      keywords,
      equipment,
      notes,
    };
  }

  saveDraft(): void {
    const formValue = this.recipeModel();
    const payload: Omit<Recipe, 'id'> = {
      ...this.serializeRecipe(formValue, 'draft'),
      createdAt: undefined,
      updatedAt: undefined,
    };

    const id = this.idToEdit();
    if (this.isEdit()) {
      if (id) {
        this.recipeService.updateRecipe(id, payload);
      }
    } else {
      const created = this.recipeService.createRecipe(payload);
      if (created && created.id) {
        this.router.navigate(['/recipes/edit', created.id]);
      }
    }
    this.isDirty.set(false);
  }

  saveRequired(status: 'scheduled' | 'published'): void {
    if (this.recipeForm().invalid()) {
      return;
    }

    const formValue = this.recipeModel();
    const id = this.idToEdit();
    const originalRecipe = id ? this.recipeService.getRecipeByIdOrSlug(String(id)) : null;

    // Timestamp calculations based on status requirements
    let createdAt = originalRecipe?.createdAt || null;
    let updatedAt = originalRecipe?.updatedAt || null;

    const currentTime = new Date().toISOString();

    if (status === 'scheduled') {
      // PrePublished / scheduled sets both createdAt and updatedAt at the same time
      createdAt = originalRecipe?.createdAt || currentTime;
      updatedAt = currentTime;
    } else if (status === 'published') {
      if (originalRecipe?.status === 'published' || originalRecipe?.status === 'updated') {
        // Changing something when Published, updatedAt changes but not createdAt
        createdAt = originalRecipe.createdAt || currentTime;
        updatedAt = currentTime;
      } else {
        // Initial publication sets both
        createdAt = currentTime;
        updatedAt = currentTime;
      }
    }

    const payload: Omit<Recipe, 'id'> = {
      ...this.serializeRecipe(formValue, status),
      createdAt: createdAt || undefined,
      updatedAt: updatedAt || undefined,
    };

    if (this.isEdit()) {
      if (id) {
        this.recipeService.updateRecipe(id, payload);
      }
    } else {
      this.recipeService.createRecipe(payload);
    }

    this.isDirty.set(false);
    this.router.navigate(['/recipes']);
  }

  private getBreadcrumbsPayload(
    breadcrumbs: Breadcrumbs | null | undefined,
    theBest: boolean,
    method: string,
    specialDiets: string[],
    holidays: string[],
  ): Breadcrumbs | undefined {
    if (!breadcrumbs || !breadcrumbs.items || breadcrumbs.items.length === 0) {
      return undefined;
    }

    const items = [...breadcrumbs.items];

    // Extract standard trails (starts with Home and Recipes, url not matching auto-generated paths)
    const standardTrails = items.filter(isStandardTrail);

    const finalItems: { label: string; url?: string }[][] = [];

    // Add all standard trails
    standardTrails.forEach((trail) => {
      finalItems.push([...trail]);
    });

    if (theBest) {
      standardTrails.forEach((standardTrail) => {
        const bestTrail: { label: string; url?: string }[] = [];
        standardTrail.forEach((b, i) => {
          if (i === 0) {
            bestTrail.push({ label: b.label, url: b.url });
            return;
          }
          if (i === 1) {
            bestTrail.push({ label: 'The Best Recipes', url: '/the-best-recipes' });
            return;
          }

          const isLast = i === standardTrail.length - 1;
          const label = isLast
            ? b.label
            : b.label.startsWith('The Best ')
              ? b.label
              : `The Best ${b.label}`;

          const parentUrl = bestTrail[i - 1].url || '';
          const rawUrl = b.url || '';
          const segments = rawUrl.split('/').filter(Boolean);
          let slug = segments[segments.length - 1] || '';

          if (!isLast) {
            if (!slug.startsWith('the-best-')) {
              slug = `the-best-${slug}`;
            }
          }

          const computedUrl = `${parentUrl.endsWith('/') ? parentUrl : parentUrl + '/'}${slug}`;
          bestTrail.push({ label, url: computedUrl });
        });

        finalItems.push(bestTrail);
      });
    }

    if (method && method.trim()) {
      const methodName = method.trim();
      const methodTrail = [
        { label: 'Method', url: '/method' },
        { label: methodName, url: `/method/${slugify(methodName)}` },
      ];
      finalItems.push(methodTrail);
    }

    if (specialDiets && specialDiets.length > 0) {
      specialDiets.forEach((diet) => {
        const dietName = diet.trim();
        if (dietName) {
          const dietTrail = [
            { label: 'Special Diets', url: '/special-diets' },
            { label: dietName, url: `/special-diets/${slugify(dietName)}` },
          ];
          finalItems.push(dietTrail);
        }
      });
    }

    if (holidays && holidays.length > 0) {
      holidays.forEach((holiday) => {
        const holidayName = holiday.trim();
        if (holidayName) {
          const holidayTrail = [
            { label: 'Holidays', url: '/holidays' },
            { label: holidayName, url: `/holidays/${slugify(holidayName)}` },
          ];
          finalItems.push(holidayTrail);
        }
      });
    }

    return {
      main: 0,
      items: finalItems,
    };
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }
}
