import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { slugify } from '@dm/library';

export interface CreatePageDialogData {
  activePost: string;
}

export interface CreatePageDialogResult {
  title: string;
  slug: string;
  fullSlug: string;
}

@Component({
  selector: 'app-create-page-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-w-[360px] sm:min-w-[460px]">
      <h2
        mat-dialog-title
        class="text-xl font-bold text-white mb-4 p-0 border-0 flex items-center gap-2">
        Create New Page
      </h2>

      <div class="flex flex-col gap-4 pt-2">
        <mat-form-field appearance="outline" class="w-full mb-0">
          <mat-label>Page Title</mat-label>
          <input
            matInput
            id="pageTitle"
            type="text"
            [(ngModel)]="title"
            (ngModelChange)="onTitleChange($event)"
            placeholder="e.g., Frequently Asked Questions" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full mb-0">
          <mat-label>Page Slug</mat-label>
          <input
            matInput
            id="pageSlug"
            type="text"
            [(ngModel)]="slug"
            (ngModelChange)="onSlugChange($event)"
            placeholder="e.g., faq" />
        </mat-form-field>

        <div class="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
          <span class="text-xs text-slate-400 block mb-1">Generated Storage Slug:</span>
          <span class="font-mono text-xs font-bold text-purple-300">
            {{ activePost }}:{{ slug || 'page-slug' }}
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
            type="button"
            (click)="onSubmit()"
            [disabled]="!title.trim() || !slug.trim()"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition cursor-pointer disabled:opacity-50">
            Create & Edit
          </button>
        </mat-dialog-actions>
      </div>
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
export class CreatePageDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreatePageDialogComponent, CreatePageDialogResult>);
  readonly data: CreatePageDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    activePost: 'home',
  };

  protected readonly activePost = this.data?.activePost || 'home';
  protected title = '';
  protected slug = '';
  private userEditedSlug = false;

  onTitleChange(newTitle: string): void {
    this.title = newTitle || '';
    if (!this.userEditedSlug) {
      this.slug = slugify(this.title);
    }
  }

  onSlugChange(newSlug: string): void {
    this.userEditedSlug = true;
    this.slug = slugify(newSlug || '');
  }

  onSubmit(): void {
    const trimmedTitle = this.title.trim();
    const trimmedSlug = this.slug.trim();
    if (!trimmedTitle || !trimmedSlug) return;

    this.dialogRef.close({
      title: trimmedTitle,
      slug: trimmedSlug,
      fullSlug: `${this.activePost}:${trimmedSlug}`,
    });
  }
}
