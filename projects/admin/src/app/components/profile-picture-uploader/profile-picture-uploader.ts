import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-profile-picture-uploader',
  imports: [NgOptimizedImage, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div
      class="p-4 rounded-2xl border border-slate-800 transition-all duration-300 bg-slate-900/80 flex flex-col justify-between gap-3 h-full"
      [attr.data-testid]="'editor-slot-' + slotKey()">
      <!-- Slot Header: Label, Description & Set Active Button -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-bold text-white flex items-center gap-1.5">
            {{ label() }}
            @if (isActive()) {
              <span
                class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold border border-purple-500/30">
                Active on Home
              </span>
            }
          </div>
          @if (description()) {
            <div class="text-xs text-slate-400">{{ description() }}</div>
          }
        </div>
        <button
          type="button"
          (click)="selectActive.emit()"
          [attr.data-testid]="'editor-pic-' + testId()"
          class="px-3 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer"
          [class.bg-purple-600]="isActive()"
          [class.border-purple-500]="isActive()"
          [class.text-white]="isActive()"
          [class.border-slate-700]="!isActive()"
          [class.bg-slate-800]="!isActive()"
          [class.text-slate-300]="!isActive()">
          {{ isActive() ? 'Active' : 'Set as Active' }}
        </button>
      </div>

      <!-- Drop Zone & Preview -->
      <div
        class="relative min-h-[160px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 group cursor-pointer"
        [class.border-purple-500]="isDragOver()"
        [class.bg-purple-500/10]="isDragOver()"
        [class.border-slate-700]="!isDragOver()"
        [class.bg-slate-950/40]="!isDragOver()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Upload photo for ' + label()"
        [attr.data-testid]="'dropzone-' + slotKey()">
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          [attr.data-testid]="'file-input-' + slotKey()"
          (change)="onFileSelected($event)"
          (click)="$event.stopPropagation()" />

        <div
          class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-slate-700 shadow-lg bg-slate-900 mb-2">
          @if (isAbsoluteUrl(picture())) {
            <img [src]="picture()" [alt]="label()" class="w-full h-full object-cover" />
          } @else {
            <img
              [ngSrc]="picture()"
              width="80"
              height="80"
              [alt]="label()"
              class="w-full h-full object-cover" />
          }
        </div>

        <div class="text-center">
          <div class="text-xs font-semibold text-slate-300 group-hover:text-purple-300 transition">
            Drop new image here or click to browse
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
            {{ picture() }}
          </div>
        </div>

        @if (isUploading()) {
          <div
            class="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-xs">
            <mat-spinner diameter="32"></mat-spinner>
            <span class="text-xs font-bold text-slate-200 mt-2">Uploading...</span>
          </div>
        }
      </div>

      <!-- Action Button -->
      <div class="flex justify-end">
        <button
          type="button"
          (click)="fileInput.click()"
          [attr.data-testid]="'btn-change-' + slotKey()"
          class="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer">
          <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">cloud_upload</mat-icon>
          Change Photo
        </button>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePictureUploaderComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly slotKey = input.required<'picture1' | 'picture2' | string>();
  readonly testId = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly picture = input.required<string>();
  readonly isActive = input<boolean>(false);

  readonly selectActive = output<void>();
  readonly pictureChange = output<string>();

  protected readonly isUploading = signal<boolean>(false);
  protected readonly isDragOver = signal<boolean>(false);

  isAbsoluteUrl(url?: string): boolean {
    if (!url) return false;
    return (
      url.startsWith('blob:') ||
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    );
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        void this.uploadFile(file);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      void this.uploadFile(file);
    }
  }

  async uploadFile(file: File): Promise<void> {
    this.isUploading.set(true);
    try {
      const uploadedPath = await this.recipeService.upload(file, 'profile');
      if (uploadedPath) {
        this.pictureChange.emit(uploadedPath);
        this.snackBar.open('Photo replaced successfully!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 3000 });
      }
    } catch (err) {
      console.error('Error uploading profile picture', err);
      this.snackBar.open('Upload error.', 'Close', { duration: 3000 });
    } finally {
      this.isUploading.set(false);
    }
  }
}
