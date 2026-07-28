import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  model,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormValueControl } from '@angular/forms/signals';
import { RecipeService } from '../../services/recipe.service';
import { FigureDialogComponent, FigureDialogData } from '../figure-dialog/figure-dialog';

@Component({
  selector: 'app-story-html-editor',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="flex flex-col gap-2 w-full">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Live Story Editor (delisha-marie style)
        </span>
        <span class="text-xs text-slate-500 italic">Visual editor & real-time preview</span>
      </div>

      <!-- Hidden File Input for Real Image Upload -->
      <input
        #imageFileInput
        type="file"
        accept="image/*"
        class="hidden"
        (change)="onFileSelected($event)" />

      <!-- Formatting Toolbar -->
      <div
        class="flex flex-wrap items-center gap-1 p-2 bg-slate-800/80 border border-slate-700/60 rounded-xl">
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('bold')"
          title="Bold">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_bold</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('italic')"
          title="Italic">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_italic</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('underline')"
          title="Underline">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_underlined</mat-icon>
        </button>

        <div class="w-px h-6 bg-slate-700 mx-1"></div>

        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('formatBlock', '<h2>')"
          title="Heading 2">
          <mat-icon class="!w-5 !h-5 !text-[20px]">title</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('formatBlock', '<h3>')"
          title="Heading 3">
          <mat-icon class="!w-5 !h-5 !text-[20px]">text_fields</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('formatBlock', '<blockquote>')"
          title="Quote">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_quote</mat-icon>
        </button>

        <div class="w-px h-6 bg-slate-700 mx-1"></div>

        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('insertUnorderedList')"
          title="Bullet List">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_list_bulleted</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('insertOrderedList')"
          title="Numbered List">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_list_numbered</mat-icon>
        </button>

        <div class="w-px h-6 bg-slate-700 mx-1"></div>

        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="promptLink()"
          title="Insert Link">
          <mat-icon class="!w-5 !h-5 !text-[20px]">link</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="triggerImageUpload()"
          title="Upload & Insert Image">
          <mat-icon class="!w-5 !h-5 !text-[20px]">image</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="openFigureDialog()"
          title="Configure Figure & Caption">
          <mat-icon class="!w-5 !h-5 !text-[20px]">subtitles</mat-icon>
        </button>
        <button
          type="button"
          mat-icon-button
          class="!w-9 !h-9 text-slate-300 hover:text-white"
          (click)="execCmd('removeFormat')"
          title="Clear Formatting">
          <mat-icon class="!w-5 !h-5 !text-[20px]">format_clear</mat-icon>
        </button>
      </div>

      <!-- Editable Canvas (styled as recipe-story from delisha-marie) -->
      <div
        #editorCanvas
        contenteditable="true"
        (input)="onInput()"
        (blur)="onInput()"
        (click)="onCanvasClick($event)"
        (keyup)="onCanvasClick($event)"
        class="recipe-story text-lg md:text-xl text-slate-200 leading-relaxed font-serif p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50 min-h-[250px] max-h-[600px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-purple-500/80 transition-all"></div>
    </div>
  `,
  styles: [
    `
      .recipe-story p {
        margin-bottom: 1.5rem;
      }
      .recipe-story p:last-child {
        margin-bottom: 0;
      }
      .recipe-story h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #f8fafc;
      }
      .recipe-story h3 {
        font-size: 1.35rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: #f1f5f9;
      }
      .recipe-story blockquote {
        border-left: 4px solid #a855f7;
        padding-left: 1rem;
        font-style: italic;
        margin: 1.5rem 0;
        color: #cbd5e1;
      }
      .recipe-story ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .recipe-story ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .recipe-story a {
        color: #c084fc;
        text-decoration: underline;
      }
      .recipe-story img {
        max-width: 100%;
        height: auto;
        border-radius: 1rem;
        margin: 1.5rem 0;
        cursor: pointer;
        transition:
          outline 0.2s ease,
          box-shadow 0.2s ease;
      }
      .recipe-story figure {
        margin: 1.5rem 0;
        cursor: pointer;
        transition:
          outline 0.2s ease,
          box-shadow 0.2s ease;
      }
      .recipe-story figure.recipe-gallery {
        display: grid;
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
        align-items: start;
      }
      .recipe-story figure.recipe-gallery:has(.column-2),
      .recipe-story figure.recipe-gallery.column-2,
      .recipe-story figure.column-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 1.25rem;
        align-items: start;
      }
      .recipe-story figure.recipe-gallery:has(.column-3),
      .recipe-story figure.recipe-gallery.column-3,
      .recipe-story figure.column-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 1rem;
        align-items: start;
      }
      .recipe-story figure.recipe-step-image,
      .recipe-story figure.recipe-image {
        margin: 0.5rem 0;
      }
      .recipe-story figure.recipe-step-image img,
      .recipe-story figure.recipe-image img {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 0.75rem;
      }
      .recipe-story img:hover,
      .recipe-story figure:hover {
        outline: 2px dashed #c084fc;
        outline-offset: 4px;
      }
      .recipe-story img.active-highlight,
      .recipe-story figure.active-highlight {
        outline: 3px solid #a855f7 !important;
        outline-offset: 6px !important;
        box-shadow: 0 0 25px rgba(168, 85, 247, 0.6) !important;
        border-radius: 1rem;
      }
      .recipe-story figcaption {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #94a3b8;
        margin-top: 0.5rem;
        text-align: center;
        font-style: italic;
      }
      .recipe-story:first-letter {
        font-size: 3.75rem;
        line-height: 1;
        font-weight: 900;
        float: left;
        margin-right: 0.5rem;
        color: #c084fc;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryHtmlEditorComponent implements FormValueControl<string> {
  // FormValueControl value signal for [formField] binding
  readonly value = model<string>('');

  // Alias getter for backward compatibility / tests
  get content() {
    return this.value;
  }

  // Modern viewChild signals
  readonly editorCanvas = viewChild<ElementRef<HTMLDivElement>>('editorCanvas');
  readonly imageFileInput = viewChild<ElementRef<HTMLInputElement>>('imageFileInput');

  private readonly recipeService = inject(RecipeService, { optional: true });
  private readonly dialog = inject(MatDialog);

  private readonly baseUrl = 'https://ik.imagekit.io/delishamarie';

  constructor() {
    // Sync model signal changes into DOM contenteditable when different
    effect(() => {
      const rawValue = this.value();
      const canvasEl = this.editorCanvas()?.nativeElement;
      if (canvasEl) {
        const formatted = this.resolveImageSrc(rawValue || '');
        const currentClean = this.stripImageBaseUrl(canvasEl.innerHTML);
        if (currentClean !== rawValue && canvasEl.innerHTML !== formatted) {
          untracked(() => {
            canvasEl.innerHTML = formatted;
          });
        }
      }
    });
  }

  onCanvasClick(event: Event): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const highlighted = canvasEl.querySelectorAll('.active-highlight');
    highlighted.forEach((el) => el.classList.remove('active-highlight'));

    const target = event.target as HTMLElement;
    if (target && canvasEl.contains(target)) {
      const imgOrFigure = target.closest('img') || target.closest('figure');
      if (imgOrFigure) {
        imgOrFigure.classList.add('active-highlight');
      }
    }
  }

  private resolveImageSrc(html: string): string {
    if (!html) return '';
    return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/(?:src)=["']([^"']+)["']/i);
      if (!srcMatch) return match;

      const originalSrc = srcMatch[1];
      if (
        originalSrc.startsWith('data:') ||
        originalSrc.startsWith('http://') ||
        originalSrc.startsWith('https://')
      ) {
        return match;
      }

      const cleanRelative = originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`;
      const newSrc = `${this.baseUrl}${cleanRelative}`;

      const newAttrs = attrs.replace(/(?:src)=["'][^"']+["']/gi, `src="${newSrc}"`);
      return `<img${newAttrs}>`;
    });
  }

  private stripImageBaseUrl(html: string): string {
    if (!html) return '';
    let clean = html.replace(/\bactive-highlight\b/g, '');
    clean = clean.replaceAll('class=" "', '');
    clean = clean.replaceAll('class=""', '');

    return clean.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/(?:src)=["']([^"']+)["']/i);
      if (!srcMatch) return match;

      const fullSrc = srcMatch[1];
      if (fullSrc.startsWith(this.baseUrl)) {
        const relativeSrc = fullSrc.slice(this.baseUrl.length);
        const newAttrs = attrs.replace(/(?:src)=["'][^"']+["']/gi, `src="${relativeSrc}"`);
        return `<img${newAttrs}>`;
      }
      return match;
    });
  }

  execCmd(command: string, value: string | undefined = undefined): void {
    document.execCommand(command, false, value);
    this.onInput();
  }

  promptLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.execCmd('createLink', url);
    }
  }

  triggerImageUpload(): void {
    const inputEl = this.imageFileInput()?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
      inputEl.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.recipeService) {
      try {
        const serverPath = await this.recipeService.upload(file);
        if (serverPath) {
          const cleanRelative = serverPath.startsWith('/') ? serverPath : `/${serverPath}`;
          const fullUrl = `${this.baseUrl}${cleanRelative}`;
          this.execCmd('insertImage', fullUrl);
        }
      } catch (err) {
        console.error('Failed to upload story image:', err);
      }
    } else {
      const objectUrl = URL.createObjectURL(file);
      this.execCmd('insertImage', objectUrl);
    }
  }

  private getTargetImage(canvasEl: HTMLElement): HTMLImageElement | null {
    const highlightedEl = canvasEl.querySelector('.active-highlight');
    if (highlightedEl) {
      if (highlightedEl instanceof HTMLImageElement) return highlightedEl;
      if (highlightedEl instanceof HTMLElement) {
        return highlightedEl.querySelector('img') || highlightedEl.closest('img');
      }
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node instanceof HTMLElement && canvasEl.contains(node)) {
        return node.closest('img') || node.querySelector('img');
      }
    }
    return null;
  }

  private getFigureElements(targetImg: HTMLImageElement): {
    inner: HTMLElement | null;
    outer: HTMLElement | null;
  } {
    const parentFig = targetImg.closest('figure');
    if (!parentFig) return { inner: null, outer: null };
    if (parentFig.parentElement?.tagName.toLowerCase() === 'figure') {
      return { inner: parentFig, outer: parentFig.parentElement };
    }
    const childFigs = Array.from(parentFig.querySelectorAll('figure'));
    const matchingChild = childFigs.find((fig) => fig.contains(targetImg));
    return matchingChild
      ? { inner: matchingChild, outer: parentFig }
      : { inner: parentFig, outer: null };
  }

  private cleanFigureClass(cls: string | undefined): string {
    return (cls || '').replace(/\bactive-highlight\b/g, '').trim();
  }

  private applyDialogResult(
    result: FigureDialogData,
    targetImg: HTMLImageElement,
    innerFigure: HTMLElement | null,
    outerFigure: HTMLElement | null,
    isGalleryContainer: boolean,
  ): void {
    const imgClone = targetImg.cloneNode(true) as HTMLImageElement;
    if (result.imgClass) imgClone.className = result.imgClass;
    else imgClone.removeAttribute('class');

    const innerFig: HTMLElement = document.createElement('figure');
    if (result.innerFigureClass) innerFig.className = result.innerFigureClass;
    innerFig.appendChild(imgClone);

    if (result.captionText) {
      const figcap = document.createElement('figcaption');
      figcap.textContent = result.captionText;
      if (result.captionClass) figcap.className = result.captionClass;
      innerFig.appendChild(figcap);
    }

    if (isGalleryContainer && outerFigure) {
      if (result.outerFigureClass) outerFigure.className = result.outerFigureClass;
      const targetToReplace = innerFigure || targetImg;
      targetToReplace.parentNode?.replaceChild(innerFig, targetToReplace);
    } else {
      let replacementNode: HTMLElement = innerFig;
      if (result.outerFigureClass) {
        const outerFig = document.createElement('figure');
        outerFig.className = result.outerFigureClass;
        outerFig.appendChild(innerFig);
        replacementNode = outerFig;
      }
      const topTargetNode = outerFigure || innerFigure || targetImg;
      topTargetNode.parentNode?.replaceChild(replacementNode, topTargetNode);
    }
  }

  openFigureDialog(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (!canvasEl) return;

    const targetImg = this.getTargetImage(canvasEl);
    if (!targetImg) return;

    const { inner: innerFigure, outer: outerFigure } = this.getFigureElements(targetImg);
    const captionEl = innerFigure?.querySelector('figcaption');

    const isGalleryContainer = !!(
      outerFigure &&
      (outerFigure.classList.contains('recipe-gallery') ||
        outerFigure.querySelectorAll('figure').length > 1)
    );

    const initialData: FigureDialogData = {
      outerFigureClass: this.cleanFigureClass(outerFigure?.className),
      innerFigureClass: this.cleanFigureClass(innerFigure?.className),
      imgClass: this.cleanFigureClass(targetImg.className),
      captionText: captionEl?.textContent || '',
      captionClass: this.cleanFigureClass(captionEl?.className),
    };

    const dialogRef = this.dialog.open(FigureDialogComponent, {
      data: initialData,
      width: '460px',
    });

    dialogRef.afterClosed().subscribe((result: FigureDialogData | undefined) => {
      if (!result || !targetImg) return;
      this.applyDialogResult(result, targetImg, innerFigure, outerFigure, isGalleryContainer);
      this.onInput();
    });
  }

  onInput(): void {
    const canvasEl = this.editorCanvas()?.nativeElement;
    if (canvasEl) {
      const cleanHtml = this.stripImageBaseUrl(canvasEl.innerHTML);
      this.value.set(cleanHtml);
    }
  }
}
