import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required, validateAsync } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { slugify } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

export interface CreateRecipeModel {
  title: string;
  slug: string;
}

@Component({
  selector: 'app-create-recipe-dialog',
  imports: [
    FormRoot,
    FormField,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-w-[400px]">
      <h2
        mat-dialog-title
        class="text-xl font-bold text-white mb-4 p-0 border-0 flex items-center gap-2">
        Create New Recipe
      </h2>
      <form
        [formRoot]="createForm"
        aria-label="Create Recipe Form"
        class="flex flex-col gap-4 pt-2">
        <!-- <mat-dialog-content class="p-0 border-0 bg-transparent flex flex-col gap-4 overflow-visible"> -->
        <div class="flex flex-col gap-1">
          <mat-form-field appearance="outline" class="w-full mb-0">
            <mat-label>Recipe Title</mat-label>
            <input
              matInput
              type="text"
              [formField]="createForm.title"
              placeholder="e.g., Spicy Chicken Tacos" />
          </mat-form-field>
          @for (error of createForm.title().errors(); track $index) {
            @if (createForm.title().touched()) {
              <span class="text-red-400 text-sm font-medium px-1">{{ error.message }}</span>
            }
          }
        </div>

        <div class="flex flex-col gap-1">
          <mat-form-field appearance="outline" class="w-full mb-0">
            <mat-label>URL Slug</mat-label>
            <input
              matInput
              type="text"
              [formField]="createForm.slug"
              placeholder="e.g., spicy-chicken-tacos"
              (input)="onSlugInput()" />
            @if (createForm.slug().pending()) {
              <mat-hint class="text-slate-400">Checking availability...</mat-hint>
            }
          </mat-form-field>
          @for (error of createForm.slug().errors(); track $index) {
            @if (createForm.slug().touched()) {
              <span class="text-red-400 text-sm font-medium px-1">{{ error.message }}</span>
            }
          }
        </div>
        <!-- </mat-dialog-content> -->

        <mat-dialog-actions class="flex justify-end gap-3 mt-6 p-0 border-0 bg-transparent">
          <button
            mat-button
            type="button"
            (click)="dialogRef.close()"
            class="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer">
            Cancel
          </button>
          <button
            mat-flat-button
            type="submit"
            [disabled]="createForm().invalid() || createForm.slug().pending() || isSubmitting()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition cursor-pointer disabled:opacity-50">
            {{ isSubmitting() ? 'Creating...' : 'Ok' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        overflow: visible !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRecipeDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateRecipeDialogComponent>);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  // protected readonly isCheckingSlug = signal(false);
  protected readonly isSubmitting = signal(false);

  private readonly model = signal<CreateRecipeModel>({
    title: '',
    slug: '',
  });

  protected readonly createForm = form(
    this.model,
    (fields) => {
      required(fields.title, { message: 'Title is required' });
      required(fields.slug, { message: 'Slug is required' });
      validateAsync(fields.slug, {
        debounce: 400,
        params: ({ value }) => value(),
        factory: (params) =>
          resource({
            params,
            loader: async ({ params }) => await this.recipeService.checkSlugAvailability(params),
          }),
        onSuccess: (value: boolean) => {
          if (!value) {
            return null;
          }

          return {
            kind: 'slug_taken',
            message: 'Slug is already taken',
          };
        },
        onError: (error: unknown) => {
          console.error('Failed to check slug availability', error);
        },
      });
    },
    {
      submission: {
        action: async (f) => {
          if (this.isSubmitting()) return;
          const value = f().value();
          this.isSubmitting.set(true);
          try {
            const title = value.title;
            const slug = value.slug;

            const newRecipe = await this.recipeService.createRecipe({
              title,
              slug,
              status: 'draft',
              author: 'Delisha Marie',
              difficulty: 'Easy',
              description: '',
              content: '',
              ingredients: [],
              instructions: [],
              image: '',
              prepTime: '',
              cookTime: '',
              totalTime: '',
              yield: '',
            });

            this.dialogRef.close();
            this.router.navigate(['/recipes/edit', newRecipe.id]);
            console.log(newRecipe);
          } catch (err) {
            console.error('Failed to create recipe', err);
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );

  private userEditedSlug = false;

  constructor() {
    // Auto-slugify title
    toObservable(this.createForm.title().value).subscribe((title) => {
      if (!this.userEditedSlug && title !== undefined) {
        this.createForm.slug().value.set(slugify(title));
      }
    });
  }

  onSlugInput() {
    this.userEditedSlug = true;
  }
}
