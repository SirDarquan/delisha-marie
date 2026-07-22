import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
  inject,
  DestroyRef,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-image-uploader',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, NgOptimizedImage],
  template: `
    <div class="flex flex-col gap-5">
      <span class="text-xs font-semibold text-slate-300">
        Recipe Image Uploader
        @if (required()) {
          <span class="text-500 font-bold ml-0.5">*</span>
        }
      </span>

      <!-- 1. DRAG & DROP ZONE / PREVIEW PANEL -->
      <div
        class="relative min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-300 backdrop-blur-md cursor-pointer group"
        [class.bg-purple-500/10]="dragOver()"
        [class.border-purple-500]="dragOver() || (previewUrl() && !dragOver())"
        [class.ring-4]="dragOver()"
        [class.ring-purple-500/20]="dragOver()"
        [class.bg-slate-950/40]="!dragOver()"
        [class.border-slate-700/60]="!dragOver() && !previewUrl()"
        [class.hover:border-purple-400]="!previewUrl()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        role="button"
        tabindex="0"
        aria-label="Image drop zone and file selector"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()">
        <!-- Hidden File Input -->
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          (change)="onFileSelected($event)"
          (click)="$event.stopPropagation()" />

        <!-- CASE A: Image is uploaded (Show Preview) -->
        @if (previewUrl()) {
          <div
            class="flex flex-col items-center gap-4 w-full animate-fadeIn"
            tabindex="0"
            (keydown.enter)="$event.stopPropagation()"
            (click)="$event.stopPropagation()">
            <div
              class="relative w-full min-h-[350px] max-h-[600px] rounded-xl shadow-lg border border-slate-700/60 bg-slate-900 flex items-center justify-center p-1">
              @if (previewError()) {
                <!-- Beautiful fallback placeholder for broken images -->
                <div
                  class="flex flex-col items-center justify-center bg-slate-950/60 text-slate-400 p-6 rounded-lg w-full h-full border border-slate-800/80">
                  <span class="material-icons text-3xl text-rose-500/80 mb-2">broken_image</span>
                  <span class="text-[10px] font-bold text-slate-300">Preview Unavailable</span>
                  @if (hasValue(currentWidth()) && hasValue(currentHeight())) {
                    <span class="text-[9px] text-slate-500 mt-1 font-mono">
                      {{ currentWidth() }}x{{ currentHeight() }}
                      @if (hasValue(currentType())) {
                        ({{ currentType() }})
                      }
                    </span>
                  } @else {
                    <span class="text-[9px] text-slate-500 mt-1 font-mono">Image load failed</span>
                  }
                </div>

                <!-- Remove Image Button (Error fallback) -->
                @if (!isUploading()) {
                  <button
                    mat-icon-button
                    type="button"
                    (click)="removeImage()"
                    aria-label="Remove image"
                    class="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition duration-300 hover:scale-105 flex items-center justify-center w-8 h-8 rounded-full border-0 cursor-pointer z-20">
                    <span class="material-icons text-sm leading-none">close</span>
                  </button>
                }
              } @else {
                <div
                  class="image-wrapper relative max-w-full max-h-full inline-flex rounded-lg overflow-hidden">
                  @if (previewUrl().startsWith('blob:') || previewUrl().startsWith('data:')) {
                    <img
                      [src]="previewUrl()"
                      alt="Recipe preview"
                      class="max-w-full max-h-[590px] object-contain rounded-lg transition duration-300"
                      (error)="onPreviewError()" />
                  } @else if (
                    previewUrl() &&
                    hasValue(currentWidth()) &&
                    hasValue(currentHeight()) &&
                    !previewUrl().startsWith('blob:') &&
                    !previewUrl().startsWith('data:')
                  ) {
                    <img
                      [ngSrc]="previewUrl()"
                      [width]="currentWidth()"
                      [height]="currentHeight()"
                      alt="Recipe preview"
                      class="max-w-full max-h-[590px] w-auto h-auto object-contain rounded-lg transition duration-300"
                      (error)="onPreviewError()" />
                  }

                  <!-- Remove Image Button -->
                  @if (!isUploading()) {
                    <button
                      mat-icon-button
                      type="button"
                      (click)="removeImage()"
                      aria-label="Remove image"
                      class="close-btn absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center w-8 h-8 rounded-full border-0 cursor-pointer z-20">
                      <span class="material-icons text-sm leading-none">close</span>
                    </button>
                  }
                </div>
              }

              <!-- Uploading Overlay -->
              @if (isUploading()) {
                <div
                  class="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <span class="material-icons animate-spin text-4xl text-purple-400 mb-2"
                    >autorenew</span
                  >
                  <span class="text-xs font-bold text-slate-200 tracking-wider uppercase"
                    >Processing...</span
                  >
                </div>
              }
            </div>
            <p
              class="text-[10px] font-semibold text-slate-400 font-mono select-all bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800/80 max-w-full truncate text-center">
              {{ currentPath() || 'Uploading...' }}
            </p>
          </div>
        } @else {
          <!-- CASE B: Dropzone is empty -->
          <div class="flex flex-col items-center gap-3 text-center pointer-events-none select-none">
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition duration-300">
              <span class="material-icons text-2xl">add_photo_alternate</span>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-200">
                Drag & drop image file or drop image URL here
              </p>
              <p class="text-[10px] text-slate-400 mt-1 font-medium">
                or click to browse your folders (accepts PNG, JPG, WEBP, GIF, SVG)
              </p>
            </div>
          </div>
        }
      </div>

      <!-- 2. AUTO-CALCULATED METADATA READONLY DISPLAY CONTAINER -->
      @if (hasValue(currentType()) || hasValue(currentWidth()) || hasValue(currentHeight())) {
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-800/20 border border-slate-700/40 rounded-2xl animate-fadeIn custom-metadata-fields">
          <!-- MIME Type container -->
          @if (hasValue(currentType())) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>MIME Type</mat-label>
              <input
                matInput
                type="text"
                [value]="currentType()"
                readonly
                class="font-mono text-slate-300" />
              <span matSuffix class="material-icons text-slate-500 mr-2">lock</span>
            </mat-form-field>
          }

          <!-- Image Width container -->
          @if (hasValue(currentWidth())) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Image Width</mat-label>
              <input
                matInput
                type="text"
                [value]="currentWidth() + ' px'"
                readonly
                class="font-mono text-slate-300" />
              <span matSuffix class="material-icons text-slate-500 mr-2">lock</span>
            </mat-form-field>
          }

          <!-- Image Height container -->
          @if (hasValue(currentHeight())) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Image Height</mat-label>
              <input
                matInput
                type="text"
                [value]="currentHeight() + ' px'"
                readonly
                class="font-mono text-slate-300" />
              <span matSuffix class="material-icons text-slate-500 mr-2">lock</span>
            </mat-form-field>
          }
        </div>
      }
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

      .custom-metadata-fields .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
      .custom-metadata-fields .mat-mdc-form-field-flex {
        height: 48px !important;
        align-items: center !important;
      }
      .custom-metadata-fields mat-form-field {
        --mdc-outlined-text-field-container-shape: 12px;
        --mdc-outlined-text-field-outline-color: rgba(71, 85, 105, 0.6);
        --mdc-outlined-text-field-focus-outline-color: #c084fc;
        --mdc-outlined-text-field-container-color: rgba(30, 41, 59, 0.4);
        --mat-select-trigger-text-color: #ffffff;
        --mat-select-placeholder-text-color: #94a3b8;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploaderComponent implements FormValueControl<string> {
  // Grab reference to file input in template
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly recipe = inject(RecipeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private _isDestroyed = false;

  // FormValueControl contract
  readonly value = model<string>('');
  readonly required = input<boolean>(false);

  // Direct inputs from the parent form
  initialImage = input<string>('');
  initialWidth = input<string>('');
  initialHeight = input<string>('');
  initialType = input<string>('');
  recipeSlug = input<string>('');

  // Single output payload event to parent form
  imageChange = output<{
    image: string;
    imageWidth: string;
    imageHeight: string;
    imageType: string;
  }>();

  // Internal uploader state signals
  protected readonly dragOver = signal<boolean>(false);
  protected readonly previewUrl = signal<string>('');
  readonly currentPath = computed(() => this.value());
  readonly aspectRatio = computed(() => {
    const w = Number.parseFloat(this.currentWidth());
    const h = Number.parseFloat(this.currentHeight());
    if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) {
      return `${w} / ${h}`;
    }
    return '';
  });
  protected readonly currentWidth = signal<string>('');
  protected readonly currentHeight = signal<string>('');
  protected readonly currentType = signal<string>('');
  protected readonly previewError = signal<boolean>(false);
  protected readonly isUploading = signal<boolean>(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this._isDestroyed = true;
    });

    // Automatically load incoming parent model image data reactively
    effect(() => {
      const imgPath = this.initialImage();
      const width = this.initialWidth();
      const height = this.initialHeight();
      const type = this.initialType();

      if (imgPath) {
        // Only update internal state if incoming image path is different from currently processed path
        // (to preserve working local blob preview URLs when the parent form model updates)
        this.value.set(imgPath);
        this.previewUrl.set(imgPath);
        this.currentWidth.set(width);
        this.currentHeight.set(height);
        this.currentType.set(type);
        this.previewError.set(false);

        // Edit Mode background dimension sync: if image path is loaded but width/height are blank, extract them
        if (!width || !height) {
          this.loadDimensionsFromUrl(imgPath);
        }
      } else {
        untracked(() => this.clearInternalState());
      }
    });
  }

  // --- DRAG & DROP EVENT HANDLERS ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.processFile(file);
      }
    } else if (event.dataTransfer) {
      // Handle URL drops (e.g. dragging a picture from another tab or pasting URL text)
      const text = event.dataTransfer.getData('text');
      if (text) {
        this.processUrl(text.trim());
      }
    }
  }

  // --- FILE SELECTION EVENT HANDLER ---

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files?.length) {
      const file = inputEl.files[0];
      this.processFile(file);
    }
  }

  // --- CORE IMAGE PROCESSING LOGIC ---

  private async processFile(file: File): Promise<void> {
    this.previewError.set(false);
    this.isUploading.set(true);

    // Create a local blob URL to show the preview immediately
    const objectUrl = URL.createObjectURL(file);
    this.previewUrl.set(objectUrl);

    // Extract natural width and height of the local file
    let width = '';
    let height = '';
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        width = img.naturalWidth.toString();
        height = img.naturalHeight.toString();
        this.currentWidth.set(width);
        this.currentHeight.set(height);
        resolve();
      };
      img.onerror = () => {
        this.currentWidth.set('');
        this.currentHeight.set('');
        resolve();
      };
      img.src = objectUrl;
    });

    const serverPath = await this.recipe.upload(file);
    if (serverPath === '') {
      this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 3000 });
      this.removeImage();
      return;
    }

    if (this._isDestroyed) {
      return;
    }

    // Use the original .webp (first in array) as the main DB reference
    this.value.set(serverPath);
    this.currentType.set('image/webp');
    this.previewUrl.set(serverPath); // Switch preview from local blob to the new server path
    this.isUploading.set(false);

    this.imageChange.emit({
      image: serverPath,
      imageWidth: width,
      imageHeight: height,
      imageType: 'image/webp',
    });

    this.snackBar.open('Image uploaded and processed successfully!', 'Close', { duration: 3000 });
  }

  private processUrl(urlStr: string): void {
    const parsed = this.getFilenameAndExtensionFromUrl(urlStr);
    const standardizedPath = `${parsed.name}.${parsed.ext}`;
    const mimeType = this.getMimeTypeFromExtension(parsed.ext);

    this.value.set(standardizedPath);
    this.currentType.set(mimeType);
    this.previewUrl.set(urlStr);
    this.previewError.set(false);

    // Extract dimensions of the dropped image URL
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth.toString();
      const h = img.naturalHeight.toString();
      this.currentWidth.set(w);
      this.currentHeight.set(h);

      this.imageChange.emit({
        image: standardizedPath,
        imageWidth: w,
        imageHeight: h,
        imageType: mimeType,
      });
    };
    img.onerror = () => {
      // Fallback gracefully on URL load failure (CORS is bypassed on simple Image loading, but bad links fail)
      this.currentWidth.set('');
      this.currentHeight.set('');
      this.imageChange.emit({
        image: standardizedPath,
        imageWidth: '',
        imageHeight: '',
        imageType: mimeType,
      });
    };
    img.src = urlStr;
  }

  private loadDimensionsFromUrl(urlStr: string): void {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth.toString();
      const h = img.naturalHeight.toString();
      this.currentWidth.set(w);
      this.currentHeight.set(h);

      let mimeType = this.currentType();
      if (!mimeType) {
        const parsed = this.getFilenameAndExtensionFromUrl(urlStr);
        mimeType = this.getMimeTypeFromExtension(parsed.ext);
        this.currentType.set(mimeType);
      }

      this.imageChange.emit({
        image: this.value(),
        imageWidth: w,
        imageHeight: h,
        imageType: mimeType,
      });
    };
    img.onerror = () => {
      /* noop */
    };
    img.src = urlStr;
  }

  // --- FORMATTING HELPERS ---

  private getFilenameAndExtensionFromUrl(urlStr: string): { name: string; ext: string } {
    try {
      // Attempt full URL parse
      const url = new URL(urlStr);
      const lastSegment =
        (
          url.pathname.split('/') as string[] & {
            findLast(predicate: (s: string) => boolean): string | undefined;
          }
        ).findLast((s: string) => !!s) || '';

      if (lastSegment?.includes('.')) {
        const parts = lastSegment.split('.');
        const ext = parts.pop() || 'jpg';
        const name = parts.join('.');
        return { name, ext };
      }
    } catch {
      // Simple path string parsing fallback
      const lastSegment =
        (
          urlStr.split('/') as string[] & {
            findLast(predicate: (s: string) => boolean): string | undefined;
          }
        ).findLast((s: string) => !!s) || '';
      if (lastSegment?.includes('.')) {
        const parts = lastSegment.split('.');
        const ext = parts.pop() || 'jpg';
        const name = parts.join('.');
        return { name, ext };
      }
    }

    // Default fallback using slug or safe name
    const fallbackSlug = this.recipeSlug() || 'recipe-image';
    return { name: fallbackSlug, ext: 'jpg' };
  }

  private getMimeTypeFromExtension(ext: string): string {
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    };
    return mimeMap[ext.toLowerCase()] || 'image/jpeg';
  }

  // --- ACTIONS ---

  removeImage(): void {
    this.clearInternalState();
    this.imageChange.emit({
      image: '',
      imageWidth: '',
      imageHeight: '',
      imageType: '',
    });
  }

  private clearInternalState(): void {
    this.previewUrl.set('');
    this.value.set('');
    this.currentWidth.set('');
    this.currentHeight.set('');
    this.currentType.set('');
    this.previewError.set(false);
  }

  onPreviewError(): void {
    // If preview fails to load (e.g. local /images/ path not on development assets server), fallback gracefully
    this.previewError.set(true);
  }

  protected hasValue(val: string | null | undefined): boolean {
    if (val === null || val === undefined) return false;
    const clean = val.toString().trim().toLowerCase();
    return (
      clean !== '' &&
      clean !== 'none' &&
      clean !== '0' &&
      clean !== '0px' &&
      clean !== 'null' &&
      clean !== 'undefined'
    );
  }
}
