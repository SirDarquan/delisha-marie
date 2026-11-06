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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryHtmlEditorComponent } from '../../components/story-html-editor/story-html-editor';
import { PagesService } from '../../services/pages.service';
import { KeywordsComponent } from '../../components/keywords/keywords';
import { ABOUT_ME_PICTURE_OPTIONS } from '../../models/kitchen-home-config';

interface PageFormModel {
  title: string;
  content: string;
  description: string;
  keywords: string[];
  featuredRecipes1: string;
  featuredRecipes2: string;
  featuredRecipes3: string;
  picture: string;
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
                  Configure featured recipe links and About Me profile image. Clear any featured
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

                <div class="space-y-2">
                  <span class="block text-xs font-semibold text-slate-300">
                    About Me Profile Picture
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (opt of pictureOptions; track opt.id) {
                      @let isSelected = pageForm.picture().value() === opt.filename;
                      <button
                        type="button"
                        (click)="selectPicture(opt.filename)"
                        [attr.data-testid]="'editor-pic-' + opt.id"
                        class="flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer"
                        [class.border-purple-500]="isSelected"
                        [class.bg-purple-500/15]="isSelected"
                        [class.text-white]="isSelected"
                        [class.border-slate-700]="!isSelected"
                        [class.bg-slate-900/80]="!isSelected"
                        [class.text-slate-300]="!isSelected"
                        [class.hover:border-slate-600]="!isSelected">
                        <div
                          class="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-700 bg-slate-800">
                          <img
                            [ngSrc]="opt.filename"
                            width="48"
                            height="48"
                            [alt]="opt.label"
                            class="w-full h-full object-cover" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="text-sm font-bold truncate flex items-center justify-between">
                            <span>{{ opt.label }}</span>
                            @if (isSelected) {
                              <mat-icon class="!w-4 !h-4 !text-[16px] text-purple-400">
                                check_circle
                              </mat-icon>
                            }
                          </div>
                          <div class="text-xs text-slate-400 line-clamp-1">
                            {{ opt.description }}
                          </div>
                          <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                            {{ opt.filename }}
                          </div>
                        </div>
                      </button>
                    }
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
  private readonly snackBar = inject(MatSnackBar);

  protected readonly slug = signal<string>('');
  readonly isKitchenHome = computed(() => this.slug() === 'kitchen:home' || this.slug() === 'home');
  protected readonly pictureOptions = ABOUT_ME_PICTURE_OPTIONS;

  protected readonly pageModel = signal<PageFormModel>({
    title: '',
    content: '',
    description: '',
    keywords: [],
    featuredRecipes1: '',
    featuredRecipes2: '',
    featuredRecipes3: '',
    picture: 'delisha_marie_profile_2.png',
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

  selectPicture(filename: string): void {
    this.pageModel.update((m) => ({ ...m, picture: filename }));
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
          picture: value.picture || 'delisha_marie_profile_2.png',
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
        let picture = 'delisha_marie_profile_2.png';

        if (this.isKitchenHome() && content.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.featuredRecipes)) {
              featured1 = parsed.featuredRecipes[0] ?? '';
              featured2 = parsed.featuredRecipes[1] ?? '';
              featured3 = parsed.featuredRecipes[2] ?? '';
            }
            if (parsed.picture) {
              picture = parsed.picture;
            }
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
