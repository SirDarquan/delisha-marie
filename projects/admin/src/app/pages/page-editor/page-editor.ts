import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { Location, NgOptimizedImage } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryHtmlEditorComponent } from '../../components/story-html-editor/story-html-editor';
import { PagesService } from '../../services/pages.service';
import { RecipeService } from '../../services/recipe.service';
import { KeywordsComponent } from '../../components/keywords/keywords';
import {
  DEFAULT_ABOUT_ME_PICTURE_1,
  DEFAULT_ABOUT_ME_PICTURE_2,
  parseKitchenHomeConfig,
} from '../../models/kitchen-home-config';

interface PageFormModel {
  title: string;
  content: string;
  description: string;
  keywords: string[];
  featuredRecipes1: string;
  featuredRecipes2: string;
  featuredRecipes3: string;
  picture: string;
  picture1: string;
  picture2: string;
}

@Component({
  selector: 'app-page-editor',
  imports: [
    FormRoot,
    FormField,
    KeywordsComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    StoryHtmlEditorComponent,
    NgOptimizedImage,
  ],
  template: `
    <div class="p-4 md:p-8">
      <div class="mb-6 max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Edit Page: {{ slug() }}</h1>
          <p class="text-slate-400 text-xs font-medium mt-1">
            Customize the HTML content for this page.
          </p>
        </div>
        <button
          type="button"
          (click)="onCancel()"
          class="text-slate-300 hover:text-purple-400 transition text-sm font-semibold cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0">
          <span class="material-icons text-sm">arrow_back</span> Back to Pages
        </button>
      </div>

      <main
        class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto backdrop-blur-md">
        <form [formRoot]="pageForm" aria-label="Page details form" class="flex flex-col gap-6">
          <div class="grid grid-cols-1 gap-5">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Title</mat-label>
              <input
                matInput
                id="title"
                type="text"
                [formField]="pageForm.title"
                placeholder="e.g., About Delisha Marie" />
            </mat-form-field>

            @if (isKitchenHome()) {
              <div class="bg-slate-800/60 border border-purple-500/30 rounded-2xl p-5 space-y-4">
                <div class="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <mat-icon class="!w-4 !h-4 !text-[18px]">tune</mat-icon>
                  Kitchen Home Configuration
                </div>
                <p class="text-xs text-slate-400">
                  Configure featured recipe links and About Me profile images. Clear any featured
                  recipe input to hide that section.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <mat-form-field appearance="outline" class="w-full mb-0">
                    <mat-label>Featured Recipe 1 Link</mat-label>
                    <input
                      matInput
                      id="featuredRecipes1"
                      type="text"
                      [formField]="pageForm.featuredRecipes1"
                      placeholder="e.g., /recipes/dinner" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full mb-0">
                    <mat-label>Featured Recipe 2 Link</mat-label>
                    <input
                      matInput
                      id="featuredRecipes2"
                      type="text"
                      [formField]="pageForm.featuredRecipes2"
                      placeholder="e.g., /recipes/breakfast" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full mb-0">
                    <mat-label>Featured Recipe 3 Link</mat-label>
                    <input
                      matInput
                      id="featuredRecipes3"
                      type="text"
                      [formField]="pageForm.featuredRecipes3"
                      placeholder="e.g., /recipes/lunch" />
                  </mat-form-field>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="block text-xs font-semibold text-slate-300">
                      About Me Profile Pictures
                    </span>
                    <span class="text-[11px] text-slate-400">
                      Select which photo is active on Kitchen Home, or upload/drag new photos to
                      replace them.
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Picture 1 Slot: About Page Picture -->
                    @let pic1 = pageModel().picture1 || defaultPic1;
                    @let is1Active = pageModel().picture === pic1;
                    <div
                      class="p-4 rounded-2xl border transition-all duration-300 bg-slate-900/80 flex flex-col justify-between gap-3"
                      [class.border-purple-500]="is1Active"
                      [class.ring-2]="is1Active"
                      [class.ring-purple-500/20]="is1Active"
                      [class.border-slate-800]="!is1Active"
                      data-testid="editor-slot-picture1">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="text-sm font-bold text-white flex items-center gap-1.5">
                            About Page Picture
                            @if (is1Active) {
                              <span
                                class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold border border-purple-500/30">
                                Active on Home
                              </span>
                            }
                          </div>
                          <div class="text-xs text-slate-400">Classic portrait from About page</div>
                        </div>
                        <button
                          type="button"
                          (click)="selectSlotPicture('picture1')"
                          [attr.data-testid]="'editor-pic-about-pic'"
                          class="px-3 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer"
                          [class.bg-purple-600]="is1Active"
                          [class.border-purple-500]="is1Active"
                          [class.text-white]="is1Active"
                          [class.border-slate-700]="!is1Active"
                          [class.bg-slate-800]="!is1Active"
                          [class.text-slate-300]="!is1Active">
                          {{ is1Active ? 'Active' : 'Set as Active' }}
                        </button>
                      </div>

                      <div
                        class="relative min-h-[160px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 group cursor-pointer"
                        [class.border-purple-500]="isDragOver().picture1"
                        [class.bg-purple-500/10]="isDragOver().picture1"
                        [class.border-slate-700]="!isDragOver().picture1"
                        [class.bg-slate-950/40]="!isDragOver().picture1"
                        (dragover)="onDragOver($event, 'picture1')"
                        (dragleave)="onDragLeave('picture1')"
                        (drop)="onDrop($event, 'picture1')"
                        (click)="fileInput1.click()"
                        (keydown.enter)="fileInput1.click()"
                        (keydown.space)="fileInput1.click()"
                        role="button"
                        tabindex="0"
                        aria-label="Upload photo for About Page Picture"
                        data-testid="dropzone-picture1">
                        <input
                          #fileInput1
                          type="file"
                          accept="image/*"
                          class="hidden"
                          data-testid="file-input-picture1"
                          (change)="onFileSelected($event, 'picture1')"
                          (click)="$event.stopPropagation()" />

                        <div
                          class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-slate-700 shadow-lg bg-slate-900 mb-2">
                          @if (isAbsoluteUrl(pic1)) {
                            <img
                              [src]="pic1"
                              alt="About Page Picture"
                              class="w-full h-full object-cover" />
                          } @else {
                            <img
                              [ngSrc]="pic1"
                              width="80"
                              height="80"
                              alt="About Page Picture"
                              class="w-full h-full object-cover" />
                          }
                        </div>

                        <div class="text-center">
                          <div
                            class="text-xs font-semibold text-slate-300 group-hover:text-purple-300 transition">
                            Drop new image here or click to browse
                          </div>
                          <div
                            class="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
                            {{ pic1 }}
                          </div>
                        </div>

                        @if (isUploading().picture1) {
                          <div
                            class="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-xs">
                            <mat-spinner diameter="32"></mat-spinner>
                            <span class="text-xs font-bold text-slate-200 mt-2">Uploading...</span>
                          </div>
                        }
                      </div>

                      <div class="flex justify-end">
                        <button
                          type="button"
                          (click)="fileInput1.click()"
                          data-testid="btn-change-picture1"
                          class="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer">
                          <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">cloud_upload</mat-icon>
                          Change Photo
                        </button>
                      </div>
                    </div>

                    <!-- Picture 2 Slot: Kitchen Home Picture -->
                    @let pic2 = pageModel().picture2 || defaultPic2;
                    @let is2Active = pageModel().picture === pic2;
                    <div
                      class="p-4 rounded-2xl border transition-all duration-300 bg-slate-900/80 flex flex-col justify-between gap-3"
                      [class.border-purple-500]="is2Active"
                      [class.ring-2]="is2Active"
                      [class.ring-purple-500/20]="is2Active"
                      [class.border-slate-800]="!is2Active"
                      data-testid="editor-slot-picture2">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="text-sm font-bold text-white flex items-center gap-1.5">
                            Kitchen Home Picture
                            @if (is2Active) {
                              <span
                                class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold border border-purple-500/30">
                                Active on Home
                              </span>
                            }
                          </div>
                          <div class="text-xs text-slate-400">Casual kitchen portrait</div>
                        </div>
                        <button
                          type="button"
                          (click)="selectSlotPicture('picture2')"
                          [attr.data-testid]="'editor-pic-kitchen-pic'"
                          class="px-3 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer"
                          [class.bg-purple-600]="is2Active"
                          [class.border-purple-500]="is2Active"
                          [class.text-white]="is2Active"
                          [class.border-slate-700]="!is2Active"
                          [class.bg-slate-800]="!is2Active"
                          [class.text-slate-300]="!is2Active">
                          {{ is2Active ? 'Active' : 'Set as Active' }}
                        </button>
                      </div>

                      <div
                        class="relative min-h-[160px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 group cursor-pointer"
                        [class.border-purple-500]="isDragOver().picture2"
                        [class.bg-purple-500/10]="isDragOver().picture2"
                        [class.border-slate-700]="!isDragOver().picture2"
                        [class.bg-slate-950/40]="!isDragOver().picture2"
                        (dragover)="onDragOver($event, 'picture2')"
                        (dragleave)="onDragLeave('picture2')"
                        (drop)="onDrop($event, 'picture2')"
                        (click)="fileInput2.click()"
                        (keydown.enter)="fileInput2.click()"
                        (keydown.space)="fileInput2.click()"
                        role="button"
                        tabindex="0"
                        aria-label="Upload photo for Kitchen Home Picture"
                        data-testid="dropzone-picture2">
                        <input
                          #fileInput2
                          type="file"
                          accept="image/*"
                          class="hidden"
                          data-testid="file-input-picture2"
                          (change)="onFileSelected($event, 'picture2')"
                          (click)="$event.stopPropagation()" />

                        <div
                          class="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-slate-700 shadow-lg bg-slate-900 mb-2">
                          @if (isAbsoluteUrl(pic2)) {
                            <img
                              [src]="pic2"
                              alt="Kitchen Home Picture"
                              class="w-full h-full object-cover" />
                          } @else {
                            <img
                              [ngSrc]="pic2"
                              width="80"
                              height="80"
                              alt="Kitchen Home Picture"
                              class="w-full h-full object-cover" />
                          }
                        </div>

                        <div class="text-center">
                          <div
                            class="text-xs font-semibold text-slate-300 group-hover:text-purple-300 transition">
                            Drop new image here or click to browse
                          </div>
                          <div
                            class="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
                            {{ pic2 }}
                          </div>
                        </div>

                        @if (isUploading().picture2) {
                          <div
                            class="absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-xs">
                            <mat-spinner diameter="32"></mat-spinner>
                            <span class="text-xs font-bold text-slate-200 mt-2">Uploading...</span>
                          </div>
                        }
                      </div>

                      <div class="flex justify-end">
                        <button
                          type="button"
                          (click)="fileInput2.click()"
                          data-testid="btn-change-picture2"
                          class="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer">
                          <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">cloud_upload</mat-icon>
                          Change Photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <div class="mb-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>SEO Description</mat-label>
                <input
                  matInput
                  id="description"
                  type="text"
                  [formField]="pageForm.description"
                  placeholder="Brief description for search engines" />
              </mat-form-field>

              <app-keywords [formField]="pageForm.keywords" />

              <app-story-html-editor [formField]="pageForm.content"> </app-story-html-editor>
            </div>
          </div>

          <div class="flex justify-end items-center gap-3 pt-5 border-t border-slate-800/60 mt-2">
            <button
              matButton="outlined"
              type="button"
              (click)="onCancel()"
              class="border-slate-700 text-slate-300 hover:bg-slate-800 transition px-5 py-2.5 rounded-xl cursor-pointer">
              Cancel
            </button>

            <button
              mat-stroked-button
              type="submit"
              [disabled]="pageForm().invalid()"
              class="px-5 py-2.5 rounded-xl font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0">
              Save Content
            </button>
          </div>
        </form>
      </main>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly pagesService = inject(PagesService);
  private readonly recipeService = inject(RecipeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly defaultPic1 = DEFAULT_ABOUT_ME_PICTURE_1;
  readonly defaultPic2 = DEFAULT_ABOUT_ME_PICTURE_2;

  protected readonly slug = signal<string>('');
  readonly isKitchenHome = computed(() => this.slug() === 'kitchen:home' || this.slug() === 'home');

  protected readonly isUploading = signal<{ picture1: boolean; picture2: boolean }>({
    picture1: false,
    picture2: false,
  });
  protected readonly isDragOver = signal<{ picture1: boolean; picture2: boolean }>({
    picture1: false,
    picture2: false,
  });

  protected readonly pageModel = signal<PageFormModel>({
    title: '',
    content: '',
    description: '',
    keywords: [],
    featuredRecipes1: '',
    featuredRecipes2: '',
    featuredRecipes3: '',
    picture: DEFAULT_ABOUT_ME_PICTURE_2,
    picture1: DEFAULT_ABOUT_ME_PICTURE_1,
    picture2: DEFAULT_ABOUT_ME_PICTURE_2,
  });

  protected readonly pageForm = form(
    this.pageModel,
    (fields) => {
      required(fields.title, { message: 'Title is required' });
    },
    {
      submission: {
        action: async (f) => this.save(f().value()),
      },
    },
  );

  isAbsoluteUrl(url?: string): boolean {
    if (!url) return false;
    return (
      url.startsWith('blob:') ||
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    );
  }

  selectSlotPicture(slot: 'picture1' | 'picture2'): void {
    const filename =
      slot === 'picture1'
        ? this.pageModel().picture1 || this.defaultPic1
        : this.pageModel().picture2 || this.defaultPic2;
    this.selectPicture(filename);
  }

  selectPicture(filename: string): void {
    this.pageModel.update((m) => ({ ...m, picture: filename }));
  }

  onDragOver(event: DragEvent, slot: 'picture1' | 'picture2'): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.update((s) => ({ ...s, [slot]: true }));
  }

  onDragLeave(slot: 'picture1' | 'picture2'): void {
    this.isDragOver.update((s) => ({ ...s, [slot]: false }));
  }

  onDrop(event: DragEvent, slot: 'picture1' | 'picture2'): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.update((s) => ({ ...s, [slot]: false }));

    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        void this.uploadFile(file, slot);
      }
    }
  }

  onFileSelected(event: Event, slot: 'picture1' | 'picture2'): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      void this.uploadFile(file, slot);
    }
  }

  async uploadFile(file: File, slot: 'picture1' | 'picture2'): Promise<void> {
    this.isUploading.update((s) => ({ ...s, [slot]: true }));
    try {
      const uploadedPath = await this.recipeService.upload(file, 'profile');
      if (uploadedPath) {
        this.pageModel.update((m) => {
          const currentSlotVal =
            slot === 'picture1' ? m.picture1 || this.defaultPic1 : m.picture2 || this.defaultPic2;
          const wasActive = m.picture === currentSlotVal;
          return {
            ...m,
            [slot]: uploadedPath,
            ...(wasActive ? { picture: uploadedPath } : {}),
          };
        });
        this.snackBar.open('Photo replaced successfully!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 3000 });
      }
    } catch (err) {
      console.error('Error uploading profile picture', err);
      this.snackBar.open('Upload error.', 'Close', { duration: 3000 });
    } finally {
      this.isUploading.update((s) => ({ ...s, [slot]: false }));
    }
  }

  async save(value: Partial<PageFormModel>) {
    try {
      let finalContent = value.content || '';
      if (this.isKitchenHome()) {
        const config = {
          featuredRecipes: [
            value.featuredRecipes1 ?? '',
            value.featuredRecipes2 ?? '',
            value.featuredRecipes3 ?? '',
          ],
          picture1: value.picture1 || this.defaultPic1,
          picture2: value.picture2 || this.defaultPic2,
          picture: value.picture || value.picture2 || this.defaultPic2,
          content: value.content || '',
        };
        finalContent = JSON.stringify(config);
      }

      const savePayload = {
        title: value.title,
        content: finalContent,
        description: value.description,
        keywords: value.keywords,
      };

      await this.pagesService.savePage(this.slug(), savePayload);
      this.snackBar.open('Page saved successfully!', 'Close', { duration: 3000 });
      void this.router.navigate(['/pages']);
    } catch (error) {
      console.error('Failed to save page', error);
      this.snackBar.open('Failed to save page.', 'Close', { duration: 3000 });
    }
  }

  ngOnInit(): void {
    const routeSlug = this.route.snapshot.paramMap.get('slug');
    if (routeSlug) {
      this.slug.set(routeSlug);
      void this.loadPageData(routeSlug);
    }
  }

  private async loadPageData(slug: string) {
    try {
      const page = await this.pagesService.getPage(slug);
      if (page) {
        let content = page.content || '';
        let featured1 = '/recipes/dinner';
        let featured2 = '/recipes/breakfast';
        let featured3 = '/recipes/lunch';
        let picture1 = this.defaultPic1;
        let picture2 = this.defaultPic2;
        let picture = this.defaultPic2;

        if (this.isKitchenHome() && content.trim().startsWith('{')) {
          try {
            const parsed = parseKitchenHomeConfig(content);
            if (Array.isArray(parsed.featuredRecipes)) {
              featured1 = parsed.featuredRecipes[0] ?? '';
              featured2 = parsed.featuredRecipes[1] ?? '';
              featured3 = parsed.featuredRecipes[2] ?? '';
            }
            picture1 = parsed.picture1 || this.defaultPic1;
            picture2 = parsed.picture2 || this.defaultPic2;
            picture = parsed.picture || picture2;
            content = parsed.content || '';
          } catch {
            // Not JSON, keep raw content
          }
        }

        this.pageModel.set({
          title: page.title || '',
          content,
          description: page.description || '',
          keywords: page.keywords || [],
          featuredRecipes1: featured1,
          featuredRecipes2: featured2,
          featuredRecipes3: featured3,
          picture,
          picture1,
          picture2,
        });
      }
    } catch (err) {
      // 404 is fine, we just leave it blank for them to create
      console.warn('Page not found, treating as new', err);
    }
  }

  protected onCancel(): void {
    this.location.back();
  }
}
