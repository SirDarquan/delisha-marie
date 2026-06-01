import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  untracked,
  ViewEncapsulation,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-5">
      <span class="text-xs font-semibold text-slate-300">Recipe Image Uploader</span>

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
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <div
            class="flex flex-col items-center gap-4 w-full animate-fadeIn"
            (click)="$event.stopPropagation()">
            <div
              class="relative max-h-[180px] rounded-xl overflow-hidden shadow-lg border border-slate-700/60 bg-slate-900 flex items-center justify-center p-1 group/img">
              <img
                [src]="previewUrl()"
                alt="Recipe preview"
                class="max-h-[160px] max-w-full rounded-lg object-contain transition duration-300 group-hover/img:brightness-90"
                (error)="onPreviewError()" />

              <!-- Remove Image Button -->
              <button
                type="button"
                (click)="removeImage()"
                aria-label="Remove image"
                class="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-full p-1.5 shadow-md transition duration-300 border-0 flex items-center justify-center cursor-pointer group/btn hover:scale-105">
                <span class="material-icons text-sm leading-none">close</span>
              </button>
            </div>
            <p
              class="text-[10px] font-semibold text-slate-400 font-mono select-all bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800/80 max-w-full truncate text-center">
              {{ currentPath() }}
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
      @if (currentPath() || currentWidth() || currentHeight()) {
        <div
          class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-800/20 border border-slate-700/40 rounded-2xl animate-fadeIn">
          <!-- MIME Type container -->
          <div class="flex flex-col gap-1.5">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span class="material-icons text-[12px] text-slate-500">lock</span> MIME Type
            </span>
            <div
              class="bg-slate-950/60 border border-slate-800/80 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-default select-all flex items-center justify-between">
              <span class="truncate font-mono">{{ currentType() || 'image/jpeg' }}</span>
              <span class="material-icons text-slate-600 text-sm">label_important</span>
            </div>
          </div>

          <!-- Image Width container -->
          <div class="flex flex-col gap-1.5">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span class="material-icons text-[12px] text-slate-500">lock</span> Image Width
            </span>
            <div
              class="bg-slate-950/60 border border-slate-800/80 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-default select-all flex items-center justify-between">
              <span class="font-mono">{{
                currentWidth() ? currentWidth() + ' px' : 'Extracting...'
              }}</span>
              <span class="material-icons text-slate-600 text-sm">settings_ethernet</span>
            </div>
          </div>

          <!-- Image Height container -->
          <div class="flex flex-col gap-1.5">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span class="material-icons text-[12px] text-slate-500">lock</span> Image Height
            </span>
            <div
              class="bg-slate-950/60 border border-slate-800/80 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-default select-all flex items-center justify-between">
              <span class="font-mono">{{
                currentHeight() ? currentHeight() + ' px' : 'Extracting...'
              }}</span>
              <span class="material-icons text-slate-600 text-sm">height</span>
            </div>
          </div>
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
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploaderComponent {
  // Grab reference to file input in template
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

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
  protected readonly currentPath = signal<string>('');
  protected readonly currentWidth = signal<string>('');
  protected readonly currentHeight = signal<string>('');
  protected readonly currentType = signal<string>('');

  constructor() {
    // Automatically load incoming parent model image data reactively
    effect(() => {
      const imgPath = this.initialImage();
      const width = this.initialWidth();
      const height = this.initialHeight();
      const type = this.initialType();

      if (imgPath) {
        // Only update internal state if incoming image path is different from currently processed path
        // (to preserve working local blob preview URLs when the parent form model updates)
        if (imgPath !== untracked(() => this.currentPath())) {
          this.currentPath.set(imgPath);
          this.previewUrl.set(imgPath);
          this.currentWidth.set(width);
          this.currentHeight.set(height);
          this.currentType.set(type);

          // Edit Mode background dimension sync: if image path is loaded but width/height are blank, extract them
          if (!width || !height) {
            this.loadDimensionsFromUrl(imgPath);
          }
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

  private processFile(file: File): void {
    const standardizedPath = this.getStandardizedPath(file.name);
    const objectUrl = URL.createObjectURL(file);

    this.currentPath.set(standardizedPath);
    this.currentType.set(file.type);
    this.previewUrl.set(objectUrl);

    // Extract natural width and height of the local file
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
        imageType: file.type,
      });
    };
    img.onerror = () => {
      this.currentWidth.set('');
      this.currentHeight.set('');
      this.imageChange.emit({
        image: standardizedPath,
        imageWidth: '',
        imageHeight: '',
        imageType: file.type,
      });
    };
    img.src = objectUrl;
  }

  private processUrl(urlStr: string): void {
    const parsed = this.getFilenameAndExtensionFromUrl(urlStr);
    const standardizedPath = this.getStandardizedPath(`${parsed.name}.${parsed.ext}`);
    const mimeType = this.getMimeTypeFromExtension(parsed.ext);

    this.currentPath.set(standardizedPath);
    this.currentType.set(mimeType);
    this.previewUrl.set(urlStr);

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

      this.imageChange.emit({
        image: this.currentPath(),
        imageWidth: w,
        imageHeight: h,
        imageType: this.currentType() || 'image/jpeg',
      });
    };
    img.onerror = () => {
      /* noop */
    };
    img.src = urlStr;
  }

  // --- FORMATTING HELPERS ---

  private getStandardizedPath(filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const trimmed = filename.trim().toLowerCase();
    // Ensure we do not double-sanitize already cleaned filenames
    if (trimmed.startsWith('/images/recipes/')) {
      return trimmed;
    }

    // Normalize spaces to dashes, lowercase all letters, and sanitize characters
    const cleanName = trimmed.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');

    return `/images/recipes/${year}/${month}/${cleanName}`;
  }

  private getFilenameAndExtensionFromUrl(urlStr: string): { name: string; ext: string } {
    try {
      // Attempt full URL parse
      const url = new URL(urlStr);
      const pathname = url.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).at(-1) || '';

      if (lastSegment && lastSegment.includes('.')) {
        const parts = lastSegment.split('.');
        const ext = parts.pop() || 'jpg';
        const name = parts.join('.');
        return { name, ext };
      }
    } catch {
      // Simple path string parsing fallback
      const lastSegment = urlStr.split('/').filter(Boolean).at(-1) || '';
      if (lastSegment && lastSegment.includes('.')) {
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
    this.currentPath.set('');
    this.currentWidth.set('');
    this.currentHeight.set('');
    this.currentType.set('');
  }

  onPreviewError(): void {
    // If preview fails to load (e.g. local /images/ path not on development assets server), fallback gracefully
    /* noop */
  }
}
