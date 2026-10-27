import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface AddPostModel {
  postName: string;
}

@Component({
  selector: 'app-add-post-dialog',
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
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-w-[360px] sm:min-w-[420px]">
      <h2
        mat-dialog-title
        class="text-xl font-bold text-white mb-4 p-0 border-0 flex items-center gap-2">
        Add New Blog Post
      </h2>

      <form
        [formRoot]="addPostForm"
        aria-label="Add New Blog Post Form"
        class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full mb-0">
          <mat-label>Post Identifier Name</mat-label>
          <input
            matInput
            id="postName"
            type="text"
            [formField]="addPostForm.postName"
            placeholder="e.g., lifestyle, garden, shop" />
        </mat-form-field>

        <p class="text-xs text-slate-400">
          Pages created under this post will have slugs like
          <code class="text-purple-300 font-mono">{{ previewSlug() }}:page-name</code>.
        </p>

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
            [disabled]="!sanitizedName()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition cursor-pointer disabled:opacity-50">
            Create Post
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPostDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AddPostDialogComponent>);

  protected readonly model = signal<AddPostModel>({
    postName: '',
  });

  protected readonly addPostForm = form(
    this.model,
    (fields) => {
      required(fields.postName, { message: 'Post identifier is required' });
    },
    {
      submission: {
        action: async () => {
          await Promise.resolve();
          this.onSubmit();
        },
      },
    },
  );

  protected readonly sanitizedName = computed(() =>
    (this.model().postName || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, ''),
  );

  protected readonly previewSlug = computed(() => this.sanitizedName() || 'post-name');

  onNameChange(val: string): void {
    this.model.set({ postName: val || '' });
  }

  onSubmit(): void {
    const name = this.sanitizedName();
    if (!name) return;
    this.dialogRef.close(name);
  }
}
