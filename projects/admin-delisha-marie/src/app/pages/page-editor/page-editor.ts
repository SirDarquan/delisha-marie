import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { Location } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryHtmlEditorComponent } from '../../components/story-html-editor/story-html-editor';
import { PagesService } from '../../services/pages.service';
import { KeywordsComponent } from '../../components/keywords/keywords';

interface PageFormModel {
  title: string;
  content: string;
  description: string;
  keywords: string[];
}

@Component({
  selector: 'app-page-editor',
  imports: [
    FormRoot,
    FormField,
    KeywordsComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    StoryHtmlEditorComponent,
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

              <!-- <app-text-input
                label="SEO Keywords"
                placeholder="Comma separated keywords"
                [formField]="pageForm.keywords"
                class="w-full">
              </app-text-input> -->

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

  protected readonly pageModel = signal<PageFormModel>({
    title: '',
    content: '',
    description: '',
    keywords: [],
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

  async save(value: PageFormModel) {
    console.log('==> SAVE METHOD STARTED', value);
    try {
      console.log('==> CALLING SAVEPAGE');
      await this.pagesService.savePage(this.slug(), value);
      console.log('==> SAVEPAGE RETURNED');
      this.snackBar.open('Page saved successfully!', 'Close', { duration: 3000 });
      console.log('==> SNACKBAR OPENED');
      this.router.navigate(['/pages']);
      console.log('==> ROUTER NAVIGATED');
    } catch (error) {
      console.error('Failed to save page', error);
      console.log('==> CATCH BLOCK');
      this.snackBar.open('Failed to save page.', 'Close', { duration: 3000 });
    }
  }

  ngOnInit(): void {
    const routeSlug = this.route.snapshot.paramMap.get('slug');
    if (routeSlug) {
      this.slug.set(routeSlug);
      this.loadPageData(routeSlug);
    }
  }

  private async loadPageData(slug: string) {
    try {
      const page = await this.pagesService.getPage(slug);
      if (page) {
        this.pageModel.set({
          title: page.title || '',
          content: page.content || '',
          description: page.description || '',
          keywords: page.keywords || [],
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
