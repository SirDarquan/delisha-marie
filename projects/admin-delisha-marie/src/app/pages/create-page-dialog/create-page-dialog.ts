import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { slugify } from '@dm/library';

export interface CreatePageDialogData {
  activePost: string;
}

export interface CreatePageDialogResult {
  title: string;
  slug: string;
  fullSlug: string;
}

export interface CreatePageModel {
  title: string;
  slug: string;
}

@Component({
  selector: 'app-create-page-dialog',
  imports: [
    FormRoot,
    FormField,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-w-[360px] sm:min-w-[460px]">
      <h2
        mat-dialog-title
        class="text-xl font-bold text-white mb-4 p-0 border-0 flex items-center gap-2">
        Create New Page
      </h2>

      <form
        [formRoot]="createPageForm"
        aria-label="Create New Page Form"
        class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full mb-0">
          <mat-label>Page Title</mat-label>
          <input
            matInput
            id="pageTitle"
            type="text"
            [formField]="createPageForm.title"
            placeholder="e.g., Frequently Asked Questions" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full mb-0">
          <mat-label>Page Slug</mat-label>
          <input
            matInput
            id="pageSlug"
            type="text"
            [formField]="createPageForm.slug"
            (input)="onSlugInput($event)"
            placeholder="e.g., faq" />
        </mat-form-field>

        <div class="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
          <span class="text-xs text-slate-400 block mb-1">Generated Storage Slug:</span>
          <span class="font-mono text-xs font-bold text-purple-300">
            {{ activePost }}:{{ normalizedSlug() || 'page-slug' }}
          </span>
        </div>

        <mat-dialog-actions class="flex justify-end gap-3 mt-4 p-0 border-0 bg-transparent">
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
            [disabled]="!canSubmit()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition cursor-pointer disabled:opacity-50">
            Create & Edit
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePageDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreatePageDialogComponent, CreatePageDialogResult>);
  readonly data: CreatePageDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    activePost: 'home',
  };

  protected readonly activePost = this.data?.activePost || 'home';
  private userEditedSlug = false;

  protected readonly model = signal<CreatePageModel>({
    title: '',
    slug: '',
  });

  protected readonly createPageForm = form(
    this.model,
    (fields) => {
      required(fields.title, { message: 'Page title is required' });
      required(fields.slug, { message: 'Page slug is required' });
    },
    {
      submission: {
        action: async () => {
          this.onSubmit();
        },
      },
    },
  );

  protected readonly normalizedSlug = computed(() => slugify(this.model().slug || ''));
  protected readonly canSubmit = computed(
    () => Boolean(this.model().title.trim()) && Boolean(this.normalizedSlug()),
  );

  private readonly _titleSub = toObservable(this.createPageForm.title().value).subscribe(
    (newTitle) => {
      if (!this.userEditedSlug && typeof newTitle === 'string') {
        this.createPageForm.slug().value.set(slugify(newTitle));
      }
    },
  );

  onSlugInput(event?: Event): void {
    this.userEditedSlug = true;
    const targetVal =
      event && (event.target as HTMLInputElement)?.value !== undefined
        ? (event.target as HTMLInputElement).value
        : this.createPageForm.slug().value();
    const clean = slugify(targetVal || '');
    this.createPageForm.slug().value.set(clean);
    this.model.update((prev) => ({ ...prev, slug: clean }));
  }

  onTitleChange(newTitle: string): void {
    const titleVal = newTitle || '';
    const slugVal = !this.userEditedSlug ? slugify(titleVal) : this.model().slug;
    this.model.set({ title: titleVal, slug: slugVal });
  }

  onSlugChange(newSlug: string): void {
    this.userEditedSlug = true;
    this.model.update((prev) => ({ ...prev, slug: slugify(newSlug || '') }));
  }

  onSubmit(): void {
    const trimmedTitle = this.model().title.trim();
    const trimmedSlug = this.normalizedSlug();
    if (!trimmedTitle || !trimmedSlug) return;

    this.dialogRef.close({
      title: trimmedTitle,
      slug: trimmedSlug,
      fullSlug: `${this.activePost}:${trimmedSlug}`,
    });
  }
}
