import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseTrail, CategoryTrails } from '@dm/library';
import { CategoryBoardComponent } from '../../components/category-board/category-board';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { CookingMethodSelectorComponent } from '../../components/cooking-method-selector/cooking-method-selector';
import { HolidaysSelectorComponent } from '../../components/holidays-selector/holidays-selector';
import { ImageUploaderComponent } from '../../components/image-uploader/image-uploader';
import { SpecialDietsSelectorComponent } from '../../components/special-diets-selector/special-diets-selector';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';

interface RecipeFormModel {
  title: string;
  slug: string;
  author: string;
  category: CategoryTrails | null;
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
  cuisine: string;
  course: string;
  keyword: string[];
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
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    CategoryBoardComponent,
    CookingMethodSelectorComponent,
    SpecialDietsSelectorComponent,
    HolidaysSelectorComponent,
    ImageUploaderComponent,
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
        <button
          type="button"
          (click)="onCancel()"
          class="text-slate-300 hover:text-purple-400 transition text-sm font-semibold cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0">
          <span class="material-icons text-sm">arrow_back</span> Back to Recipes
        </button>
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
        <form [formRoot]="recipeForm" aria-label="Recipe details form" class="flex flex-col gap-6">
          <!-- 1. WHAT IS IT Tab -->
          @if (activeTab() === 'what') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Title</mat-label>
                <input
                  matInput
                  id="title"
                  type="text"
                  [formField]="recipeForm.title"
                  placeholder="e.g., Creamy Tuscan Pasta"
                  aria-required="true" />
                @for (error of recipeForm.title().errors(); track error) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Slug</mat-label>
                <input
                  matInput
                  id="slug"
                  type="text"
                  [formField]="recipeForm.slug"
                  placeholder="e.g., creamy-tuscan-pasta"
                  aria-required="true" />
                @for (error of recipeForm.slug().errors(); track error) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Difficulty</mat-label>
                <mat-select id="difficulty" [formField]="recipeForm.difficulty">
                  <mat-option value="Easy">Easy</mat-option>
                  <mat-option value="Intermediate">Intermediate</mat-option>
                  <mat-option value="Advanced">Advanced</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Prep Time</mat-label>
                <input
                  matInput
                  id="prepTime"
                  type="text"
                  [formField]="recipeForm.prepTime"
                  placeholder="e.g., 15 mins" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Cook Time</mat-label>
                <input
                  matInput
                  id="cookTime"
                  type="text"
                  [formField]="recipeForm.cookTime"
                  placeholder="e.g., 20 mins" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Total Time</mat-label>
                <input
                  matInput
                  id="totalTime"
                  type="text"
                  [formField]="recipeForm.totalTime"
                  placeholder="e.g., 35 mins" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Yield</mat-label>
                <input
                  matInput
                  id="yield"
                  type="text"
                  [formField]="recipeForm.yield"
                  placeholder="e.g., 4 servings" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Author</mat-label>
                <input
                  matInput
                  id="author"
                  type="text"
                  [formField]="recipeForm.author"
                  placeholder="e.g., Delisha Marie" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Cuisine</mat-label>
                <input
                  matInput
                  id="cuisine"
                  type="text"
                  [formField]="recipeForm.cuisine"
                  placeholder="e.g., Italian, Mexican" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Course</mat-label>
                <input
                  matInput
                  id="course"
                  type="text"
                  [formField]="recipeForm.course"
                  placeholder="e.g., Dinner, Breakfast" />
              </mat-form-field>

              <div class="flex flex-col gap-3 md:col-span-2">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-200 uppercase tracking-wider"
                    >Keywords</span
                  >
                  <button
                    type="button"
                    (click)="addKeyword()"
                    class="px-4 py-1.5 text-xs font-bold rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1 shadow-sm leading-none">
                    <span class="material-icons text-sm">add</span>
                    Add Keyword
                  </button>
                </div>

                <div
                  class="flex flex-wrap gap-2.5 items-center min-h-[46px] p-3 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <mat-chip-set class="flex flex-wrap gap-2 items-center w-full">
                    @for (kw of recipeModel().keyword; track $index; let i = $index) {
                      <mat-chip
                        class="!bg-purple-500/10 !border !border-purple-500/20 !rounded-xl !h-auto !py-1.5 !px-3">
                        <div class="flex items-center gap-1.5">
                          <input
                            [id]="'keyword-' + i"
                            type="text"
                            [value]="kw"
                            (input)="onKeywordInput(i, $event)"
                            [size]="kw.length > 8 ? kw.length + 2 : 10"
                            placeholder="Keyword..."
                            class="bg-transparent border-0 p-0 text-xs font-semibold text-white focus:outline-none placeholder-slate-500 transition-all" />
                          <button
                            type="button"
                            (click)="removeKeyword(i)"
                            class="text-slate-400 hover:text-rose-400 cursor-pointer flex items-center transition border-0 bg-transparent p-0 leading-none">
                            <span class="material-icons text-sm">close</span>
                          </button>
                        </div>
                      </mat-chip>
                    }
                    @if (!recipeModel().keyword || recipeModel().keyword.length === 0) {
                      <span class="text-slate-500 text-xs italic"
                        >No keywords added yet. Click "Add Keyword" to start.</span
                      >
                    }
                  </mat-chip-set>
                </div>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-image-uploader
                  [formField]="recipeForm.image"
                  [initialImage]="recipeModel().image"
                  [initialWidth]="recipeModel().imageWidth"
                  [initialHeight]="recipeModel().imageHeight"
                  [initialType]="recipeModel().imageType"
                  [recipeSlug]="recipeModel().slug"
                  (imageChange)="onImageUploaded($event)">
                </app-image-uploader>
              </div>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Brief Description</mat-label>
                <textarea
                  matInput
                  id="description"
                  [formField]="recipeForm.description"
                  rows="2"
                  placeholder="Brief summary of the recipe..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Full Content/Story (HTML or Text)</mat-label>
                <textarea
                  matInput
                  id="content"
                  [formField]="recipeForm.content"
                  rows="4"
                  placeholder="Detailed story or description..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Ingredients (One per line)</mat-label>
                <textarea
                  matInput
                  id="ingredients"
                  [formField]="recipeForm.ingredients"
                  rows="4"
                  placeholder="Enter ingredients..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Instructions (One per line)</mat-label>
                <textarea
                  matInput
                  id="instructions"
                  [formField]="recipeForm.instructions"
                  rows="4"
                  placeholder="Enter instructions..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Equipment (One per line)</mat-label>
                <textarea
                  matInput
                  id="equipment"
                  [formField]="recipeForm.equipment"
                  rows="3"
                  placeholder="Enter equipment..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full md:col-span-2">
                <mat-label>Recipe Notes (One per line)</mat-label>
                <textarea
                  matInput
                  id="notes"
                  [formField]="recipeForm.notes"
                  rows="3"
                  placeholder="Enter recipe notes..."
                  class="resize-y"></textarea>
              </mat-form-field>

              <!-- Nutritional Information -->
              <div class="flex flex-col gap-3 md:col-span-2 border-t border-slate-800/60 pt-4 mt-2">
                <h4 class="text-sm font-semibold text-white">Nutritional Information</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Serving Size</mat-label>
                    <input
                      matInput
                      id="servingSize"
                      type="text"
                      [formField]="recipeForm.servingSize"
                      placeholder="e.g., 1 slice" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Calories</mat-label>
                    <input
                      matInput
                      id="calories"
                      type="text"
                      [formField]="recipeForm.calories"
                      placeholder="e.g., 250 kcal" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Fat</mat-label>
                    <input
                      matInput
                      id="fat"
                      type="text"
                      [formField]="recipeForm.fat"
                      placeholder="e.g., 12g" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Saturated Fat</mat-label>
                    <input
                      matInput
                      id="saturatedFat"
                      type="text"
                      [formField]="recipeForm.saturatedFat"
                      placeholder="e.g., 4g" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Cholesterol</mat-label>
                    <input
                      matInput
                      id="cholesterol"
                      type="text"
                      [formField]="recipeForm.cholesterol"
                      placeholder="e.g., 15mg" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Sodium</mat-label>
                    <input
                      matInput
                      id="sodium"
                      type="text"
                      [formField]="recipeForm.sodium"
                      placeholder="e.g., 120mg" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Carbohydrates</mat-label>
                    <input
                      matInput
                      id="carbohydrates"
                      type="text"
                      [formField]="recipeForm.carbohydrates"
                      placeholder="e.g., 30g" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Fiber</mat-label>
                    <input
                      matInput
                      id="fiber"
                      type="text"
                      [formField]="recipeForm.fiber"
                      placeholder="e.g., 3g" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Sugar</mat-label>
                    <input
                      matInput
                      id="sugar"
                      type="text"
                      [formField]="recipeForm.sugar"
                      placeholder="e.g., 5g" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Protein</mat-label>
                    <input
                      matInput
                      id="protein"
                      type="text"
                      [formField]="recipeForm.protein"
                      placeholder="e.g., 8g" />
                  </mat-form-field>
                </div>
              </div>
            </div>
          }

          <!-- 2. WHERE IS IT Tab -->
          @if (activeTab() === 'where') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              <!-- Dynamic Stackable Category Board -->
              <div class="flex flex-col gap-1 md:col-span-2">
                <app-category-board
                  [formField]="recipeForm.category"
                  [recipeTitle]="recipeModel().title"
                  [recipeSlug]="recipeModel().slug"
                  (categoryChange)="onCategoryChanged($event)">
                </app-category-board>
                @if (recipeForm.category().touched() && recipeForm.category().invalid()) {
                  @for (error of recipeForm.category().errors(); track error) {
                    <div class="text-rose-400 text-xs font-semibold mt-1 px-1">
                      {{ error.message }}
                    </div>
                  }
                }
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
                  [formField]="recipeForm.method"
                  (methodChange)="onMethodChanged($event)">
                </app-cooking-method-selector>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-holidays-selector
                  [formField]="recipeForm.holidays"
                  (holidayChange)="onHolidayChanged($event)">
                </app-holidays-selector>
              </div>

              <div class="flex flex-col gap-1 md:col-span-2">
                <app-special-diets-selector
                  [formField]="recipeForm.specialDiets"
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
                [disabled]="isPublicationDisabled()"
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
                [disabled]="isPublicationDisabled() || !isDirty()"
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
                [disabled]="isPublicationDisabled() || !isDirty()"
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
  private readonly dialog = inject(MatDialog);

  protected readonly isEdit = signal<boolean>(false);
  private readonly idToEdit = signal<string | number | null>(null);

  // active view state toggling
  protected readonly activeTab = signal<'what' | 'where'>('what');

  // Track draft changes state
  // Modern Signal-based Form state
  protected readonly recipeModel = signal<RecipeFormModel>({
    title: '',
    slug: '',
    author: 'Delisha Marie',
    category: null,
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
    cuisine: '',
    course: '',
    keyword: [],
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
      required(fields.category, { message: 'Category is required' });
      required(fields.difficulty, { message: 'Difficulty is required' });
      required(fields.prepTime, { message: 'Prep time is required' });
      required(fields.cookTime, { message: 'Cook time is required' });
      required(fields.totalTime, { message: 'Total time is required' });
      required(fields.yield, { message: 'Yield is required' });
      required(fields.image, { message: 'Image is required' });
      required(fields.imageWidth, { message: 'Image width is required' });
      required(fields.imageHeight, { message: 'Image height is required' });
      required(fields.imageType, { message: 'Image type is required' });
      required(fields.description, { message: 'Description is required' });
      required(fields.content, { message: 'Content is required' });
      required(fields.ingredients, { message: 'Ingredients is required' });
      required(fields.instructions, { message: 'Instructions is required' });
      required(fields.method, { message: 'Method is required' });
      required(fields.cuisine, { message: 'Cuisine is required' });
      required(fields.course, { message: 'Course is required' });
      required(fields.servingSize, { message: 'Serving size is required' });
      required(fields.calories, { message: 'Calories is required' });
      required(fields.fat, { message: 'Fat is required' });
      required(fields.carbohydrates, { message: 'Carbohydrates is required' });
      required(fields.protein, { message: 'Protein is required' });
      required(fields.fiber, { message: 'Fiber is required' });
      required(fields.sugar, { message: 'Sugar is required' });
      required(fields.sodium, { message: 'Sodium is required' });
      required(fields.cholesterol, { message: 'Cholesterol is required' });
      required(fields.saturatedFat, { message: 'Saturated fat is required' });
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

  // Track draft changes state
  private readonly initialModel = signal<RecipeFormModel | null>(null);
  private isInitialized = false;

  private getFieldValue(key: keyof RecipeFormModel) {
    const formFields = this.recipeForm;
    const fieldFn = formFields[key];
    if (fieldFn && typeof fieldFn === 'function') {
      try {
        const fieldObj = fieldFn();
        if (fieldObj && typeof fieldObj.controlValue === 'function') {
          return fieldObj.controlValue();
        }
      } catch {
        // Fallback to model if form is not fully initialized or throws
      }
    }
    return this.recipeModel()[key];
  }

  private getCurrentFormValue(): RecipeFormModel {
    const initial = this.initialModel() || this.recipeModel();
    const current = { ...this.recipeModel() };
    const keys = Object.keys(initial) as (keyof RecipeFormModel)[];
    for (const key of keys) {
      const currentVal = this.getFieldValue(key);
      (current as unknown as Record<string, unknown>)[key] = currentVal;
    }
    return current;
  }

  private valuesAreEqual(key: keyof RecipeFormModel, a: unknown, b: unknown): boolean {
    if (key === 'category') {
      const categoryA = a as CategoryTrails | null;
      const categoryB = b as CategoryTrails | null;
      if (categoryA === categoryB) return true;
      if (!categoryA || !categoryB) return false;
      return JSON.stringify(categoryA) === JSON.stringify(categoryB);
    }

    if (Array.isArray(b)) {
      const arrA = (a as readonly unknown[]) || [];
      return arrA.length === b.length && arrA.every((v, i) => v === b[i]);
    }

    if ((a !== null && typeof a === 'object') || (b !== null && typeof b === 'object')) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    const normA = typeof a === 'string' || typeof a === 'boolean' ? String(a) : '';
    const normB = typeof b === 'string' || typeof b === 'boolean' ? String(b) : '';
    return normA.trim() === normB.trim();
  }

  protected readonly isDirty = computed(() => {
    const initial = this.initialModel();
    if (!initial) {
      return false;
    }

    const keys = Object.keys(initial) as (keyof RecipeFormModel)[];
    for (const key of keys) {
      const currentVal = this.getFieldValue(key);
      const initialVal = initial[key];

      if (!this.valuesAreEqual(key, currentVal, initialVal)) {
        return true;
      }
    }
    return false;
  });

  protected readonly isDraftDisabled = computed(() => !this.isDirty());

  protected readonly isPublicationDisabled = computed(() => {
    const isMissing = (val: unknown) => {
      return val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
    };
    const categoryVal = this.getFieldValue('category') as CategoryTrails | null;
    const isCategoryMissing =
      !categoryVal?.trails || categoryVal.trails.every((t) => t.length <= 2);
    return (
      isMissing(this.getFieldValue('title')) ||
      isMissing(this.getFieldValue('slug')) ||
      isCategoryMissing ||
      isMissing(this.getFieldValue('difficulty')) ||
      isMissing(this.getFieldValue('prepTime')) ||
      isMissing(this.getFieldValue('cookTime')) ||
      isMissing(this.getFieldValue('totalTime')) ||
      isMissing(this.getFieldValue('yield')) ||
      isMissing(this.getFieldValue('image')) ||
      isMissing(this.getFieldValue('imageWidth')) ||
      isMissing(this.getFieldValue('imageHeight')) ||
      isMissing(this.getFieldValue('imageType')) ||
      isMissing(this.getFieldValue('description')) ||
      isMissing(this.getFieldValue('content')) ||
      isMissing(this.getFieldValue('ingredients')) ||
      isMissing(this.getFieldValue('instructions')) ||
      isMissing(this.getFieldValue('method')) ||
      isMissing(this.getFieldValue('cuisine')) ||
      isMissing(this.getFieldValue('course')) ||
      isMissing(this.getFieldValue('servingSize')) ||
      isMissing(this.getFieldValue('calories')) ||
      isMissing(this.getFieldValue('fat')) ||
      isMissing(this.getFieldValue('carbohydrates')) ||
      isMissing(this.getFieldValue('protein')) ||
      isMissing(this.getFieldValue('fiber')) ||
      isMissing(this.getFieldValue('sugar')) ||
      isMissing(this.getFieldValue('sodium')) ||
      isMissing(this.getFieldValue('cholesterol')) ||
      isMissing(this.getFieldValue('saturatedFat'))
    );
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.idToEdit.set(id);
      const recipe = this.recipeService.getRecipeByIdOrSlug(id);
      console.log(recipe);
      if (recipe) {
        const mapped = this.mapRecipeToForm(recipe);
        this.recipeModel.set(mapped);
        this.initialModel.set(mapped);

        // Propagate loaded image metadata values directly to the form controls (targets)
        this.recipeForm.imageWidth().value.set(mapped.imageWidth);
        this.recipeForm.imageHeight().value.set(mapped.imageHeight);
        this.recipeForm.imageType().value.set(mapped.imageType);
      } else {
        this.initialModel.set({ ...this.recipeModel() });
      }
    } else {
      this.initialModel.set({ ...this.recipeModel() });
    }
    setTimeout(() => {
      this.isInitialized = true;
    }, 0);
  }

  private mapRecipeToForm(recipe: Recipe): RecipeFormModel {
    let holidayStr = '';
    if (recipe.holidays && recipe.holidays.length > 0) {
      const firstHoliday = recipe.holidays[0];
      if (typeof firstHoliday === 'object' && firstHoliday !== null) {
        holidayStr = (firstHoliday as { name?: string }).name || '';
      } else {
        holidayStr = String(firstHoliday);
      }
    }

    const specialDietsList = (recipe.specialDiets || []).map((d: unknown) => {
      if (typeof d === 'object' && d !== null) {
        return (d as { name?: string }).name || '';
      }
      return String(d);
    });

    return {
      title: recipe.title || '',
      slug: recipe.slug || '',
      author: recipe.author || 'Delisha Marie',
      category: recipe.category && typeof recipe.category === 'object' ? recipe.category : null,
      difficulty: recipe.difficulty || 'Easy',
      prepTime: recipe.prepTime || '',
      cookTime: recipe.cookTime || '',
      totalTime: recipe.totalTime || '',
      yield: recipe.yield || '',
      status: recipe.status || 'draft',
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
      holidays: holidayStr,
      specialDiets: specialDietsList,
      cuisine: recipe.cuisine || '',
      course: recipe.course || '',
      keyword: recipe.keywords || [],
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
    };
  }

  onCategoryChanged(c: CategoryTrails): void {
    this.recipeModel.update((model) => ({
      ...model,
      category: c,
    }));
  }

  onImageUploaded(event: {
    image: string;
    imageWidth: string;
    imageHeight: string;
    imageType: string;
  }): void {
    this.recipeModel.update((model) => ({
      ...model,
      image: event.image,
      imageWidth: event.imageWidth,
      imageHeight: event.imageHeight,
      imageType: event.imageType,
    }));

    // Explicitly set the form control values (targets)
    this.recipeForm.imageWidth().value.set(event.imageWidth);
    this.recipeForm.imageHeight().value.set(event.imageHeight);
    this.recipeForm.imageType().value.set(event.imageType);
  }

  onMethodChanged(method: string): void {
    this.recipeModel.update((model) => ({
      ...model,
      method,
    }));
  }

  onSpecialDietsChanged(specialDiets: string[]): void {
    this.recipeModel.update((model) => ({
      ...model,
      specialDiets,
    }));
  }

  onHolidayChanged(holiday: string): void {
    this.recipeModel.update((model) => ({
      ...model,
      holidays: holiday,
    }));
  }

  addKeyword(): void {
    this.recipeModel.update((model) => ({
      ...model,
      keyword: [...(model.keyword || []), ''],
    }));
  }

  removeKeyword(idx: number): void {
    this.recipeModel.update((model) => ({
      ...model,
      keyword: (model.keyword || []).filter((_, i) => i !== idx),
    }));
  }

  onKeywordInput(idx: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.recipeModel.update((model) => {
      const updated = [...(model.keyword || [])];
      updated[idx] = value;
      return {
        ...model,
        keyword: updated,
      };
    });
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
    const keywords = formValue.keyword
      ? formValue.keyword.map((k) => k.trim()).filter(Boolean)
      : [];
    const holidays = formValue.holidays ? [formValue.holidays] : [];
    const specialDiets = formValue.specialDiets || [];

    const nutrition =
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
            servingSize: formValue.servingSize?.trim() || '',
            calories: formValue.calories?.trim() || '',
            fat: formValue.fat?.trim() || '',
            carbohydrates: formValue.carbohydrates?.trim() || '',
            protein: formValue.protein?.trim() || '',
            fiber: formValue.fiber?.trim() || '',
            sugar: formValue.sugar?.trim() || '',
            sodium: formValue.sodium?.trim() || '',
            cholesterol: formValue.cholesterol?.trim() || '',
            saturatedFat: formValue.saturatedFat?.trim() || '',
          }
        : null;

    const categoryTrails = formValue.category
      ? formValue.category.trails.filter(
          (trail) => trail[0]?.url === '/' && trail[1]?.url === '/recipes',
        )
      : [];
    if (formValue.theBest && categoryTrails.length > 0) {
      const bestTrails = categoryTrails.map((trail) => this.getBestTrail(trail));
      categoryTrails.push(...bestTrails);
    }

    return {
      title: formValue.title || '',
      slug: formValue.slug || '',
      category: { trails: categoryTrails },
      difficulty: formValue.difficulty || 'Easy',
      prepTime: formValue.prepTime?.trim() || null,
      cookTime: formValue.cookTime?.trim() || null,
      totalTime: formValue.totalTime?.trim() || null,
      yield: formValue.yield?.trim() || null,
      image: formValue.image?.trim() || null,
      imageWidth: formValue.imageWidth?.trim() || null,
      imageHeight: formValue.imageHeight?.trim() || null,
      imageType: formValue.imageType?.trim() || null,
      description: formValue.description?.trim() || null,
      content: formValue.content?.trim() || null,
      ingredients,
      instructions,
      author: formValue.author || 'Delisha Marie',
      status,
      preview_token: formValue.preview_token?.trim() || null,
      method: formValue.method?.trim() || null,
      theBest: formValue.theBest || false,
      holidays,
      specialDiets,
      breadcrumbs: null,
      cuisine: formValue.cuisine?.trim() || null,
      course: formValue.course?.trim() || null,
      nutrition,
      keywords,
      equipment,
      notes,
    } as unknown as Omit<Recipe, 'id'>;
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
      if (created?.id) {
        this.router.navigate(['/recipes/edit', created.id]);
      }
    }
    this.initialModel.set(this.getCurrentFormValue());
    this.recipeModel().status = 'draft';
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
      createdAt = originalRecipe?.createdAt || currentTime;
      updatedAt = currentTime;
    } else if (status === 'published') {
      if (originalRecipe?.status === 'published' || originalRecipe?.status === 'updated') {
        createdAt = originalRecipe.createdAt || currentTime;
        updatedAt = currentTime;
      } else {
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

    this.initialModel.set(this.getCurrentFormValue());
    this.router.navigate(['/recipes']);
    this.isEdit.set(false);
  }

  private getBestTrail(standardTrail: BaseTrail[]): BaseTrail[] {
    const bestTrail: BaseTrail[] = [];
    standardTrail.forEach((b, i) => {
      if (i === 0) {
        bestTrail.push({ name: b.name, url: b.url });
        return;
      }
      if (i === 1) {
        bestTrail.push({ name: 'The Best Recipes', url: '/the-best-recipes' });
        return;
      }

      const isRecipe = b.url && (b.url.startsWith('/recipe/') || b.url.startsWith('recipe/'));
      let name = b.name;
      if (!isRecipe && !b.name.startsWith('The Best ')) {
        name = `The Best ${b.name}`;
      }

      const parentUrl = bestTrail[i - 1].url || '';
      const rawUrl = b.url || '';
      const segments = rawUrl.split('/').filter(Boolean);
      let slug = segments.at(-1) || '';

      if (!isRecipe && !slug.startsWith('the-best-')) {
        slug = `the-best-${slug}`;
      }

      let computedUrl = rawUrl;
      if (!isRecipe) {
        const prefix = parentUrl.endsWith('/') ? parentUrl : `${parentUrl}/`;
        computedUrl = `${prefix}${slug}`;
      }
      bestTrail.push({ name, url: computedUrl });
    });
    return bestTrail;
  }

  onCancel(): void {
    if (this.isDirty()) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message:
            'You have unsaved changes. Are you sure you want to leave? Your changes will be deleted.',
          stayLabel: 'Stay',
          leaveLabel: 'Leave',
          icon: 'warning',
        },
      });

      dialogRef.afterClosed().subscribe((leave) => {
        if (leave) {
          this.router.navigate(['/recipes']);
        }
      });
    } else {
      this.router.navigate(['/recipes']);
    }
  }
}
