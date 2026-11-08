import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfilePictureUploaderComponent } from '../profile-picture-uploader/profile-picture-uploader';
import { KitchenHomeSettings, SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-kitchen-home-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ProfilePictureUploaderComponent,
  ],
  template: `
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <mat-icon>tune</mat-icon>
          </div>
          <div>
            <h2 mat-dialog-title class="text-lg font-bold text-white p-0 border-0 leading-none">
              Kitchen Home Settings
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Configure featured recipes and author bio pictures.
            </p>
          </div>
        </div>
        <button
          mat-icon-button
          type="button"
          (click)="dialogRef.close()"
          aria-label="Close dialog"
          data-testid="btn-close-dialog"
          class="text-slate-400 hover:text-white cursor-pointer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (isLoading()) {
        <div
          class="flex flex-col items-center justify-center py-12 gap-3"
          data-testid="dialog-loading">
          <mat-spinner diameter="36"></mat-spinner>
          <span class="text-xs text-slate-400">Loading settings...</span>
        </div>
      } @else {
        <form (ngSubmit)="save()" class="flex flex-col gap-6">
          <!-- Featured Recipe Links Section -->
          <div>
            <h3
              class="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-[16px] text-pink-400">restaurant_menu</mat-icon>
              Featured Recipe Links
            </h3>
            <p class="text-xs text-slate-400 mb-3">
              Enter relative slugs (e.g.
              <code class="text-purple-300 font-mono">/recipes/my-favorite-pasta</code>) or absolute
              URLs.
            </p>

            <div class="space-y-3">
              <div class="flex flex-col gap-1">
                <label for="recipe-slot-0" class="text-xs font-semibold text-slate-300"
                  >Slot 1 Recipe URL</label
                >
                <input
                  id="recipe-slot-0"
                  type="text"
                  [ngModel]="recipe1()"
                  (ngModelChange)="recipe1.set($event)"
                  name="recipe1"
                  placeholder="/recipes/featured-1"
                  data-testid="recipe-slot-0"
                  class="w-full bg-slate-950/60 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="recipe-slot-1" class="text-xs font-semibold text-slate-300"
                  >Slot 2 Recipe URL</label
                >
                <input
                  id="recipe-slot-1"
                  type="text"
                  [ngModel]="recipe2()"
                  (ngModelChange)="recipe2.set($event)"
                  name="recipe2"
                  placeholder="/recipes/featured-2"
                  data-testid="recipe-slot-1"
                  class="w-full bg-slate-950/60 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition" />
              </div>

              <div class="flex flex-col gap-1">
                <label for="recipe-slot-2" class="text-xs font-semibold text-slate-300"
                  >Slot 3 Recipe URL</label
                >
                <input
                  id="recipe-slot-2"
                  type="text"
                  [ngModel]="recipe3()"
                  (ngModelChange)="recipe3.set($event)"
                  name="recipe3"
                  placeholder="/recipes/featured-3"
                  data-testid="recipe-slot-2"
                  class="w-full bg-slate-950/60 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition" />
              </div>
            </div>
          </div>

          <!-- Author Bio Pictures Section -->
          <div>
            <h3
              class="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-[16px] text-purple-400">account_circle</mat-icon>
              Author Bio Pictures
            </h3>
            <p class="text-xs text-slate-400 mb-3">
              Upload photos specifically for Kitchen Home author bio and Recipe Sidebar author bio.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-profile-picture-uploader
                slotKey="kitchen_about"
                label="Kitchen About"
                description="Displayed on Kitchen Home author bio"
                [picture]="kitchenAbout()"
                [showActiveToggle]="false"
                (pictureChange)="kitchenAbout.set($event)" />

              <app-profile-picture-uploader
                slotKey="sidebar_about"
                label="Sidebar About"
                description="Displayed on Recipe Sidebar author bio"
                [picture]="sidebarAbout()"
                [showActiveToggle]="false"
                (pictureChange)="sidebarAbout.set($event)" />
            </div>
          </div>

          <!-- Actions -->
          <mat-dialog-actions
            class="flex justify-end gap-3 pt-4 border-t border-slate-800 p-0 bg-transparent mt-2">
            <button
              mat-button
              type="button"
              (click)="dialogRef.close()"
              data-testid="btn-cancel"
              class="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer">
              Cancel
            </button>
            <button
              mat-flat-button
              type="submit"
              [disabled]="isSaving()"
              data-testid="btn-save-kitchen-home"
              class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition cursor-pointer disabled:opacity-50 flex items-center gap-2">
              @if (isSaving()) {
                <mat-spinner diameter="18" class="inline-block"></mat-spinner>
                <span>Saving...</span>
              } @else {
                <span>Save Changes</span>
              }
            </button>
          </mat-dialog-actions>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenHomeDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<KitchenHomeDialogComponent>);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSaving = signal<boolean>(false);

  readonly recipe1 = signal<string>('');
  readonly recipe2 = signal<string>('');
  readonly recipe3 = signal<string>('');
  readonly kitchenAbout = signal<string>('delisha_marie_profile_2.png');
  readonly sidebarAbout = signal<string>('delisha_marie_profile.png');

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    try {
      const settings = await this.settingsService.getKitchenHomeSettings();
      if (settings) {
        this.recipe1.set(settings.featuredRecipes?.[0] ?? '');
        this.recipe2.set(settings.featuredRecipes?.[1] ?? '');
        this.recipe3.set(settings.featuredRecipes?.[2] ?? '');
        this.kitchenAbout.set(settings.kitchen_about || 'delisha_marie_profile_2.png');
        this.sidebarAbout.set(settings.sidebar_about || 'delisha_marie_profile.png');
      }
    } catch (err) {
      console.error('Failed to load Kitchen Home settings', err);
      this.snackBar.open('Failed to load settings.', 'Close', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    this.isSaving.set(true);
    try {
      const payload: KitchenHomeSettings = {
        featuredRecipes: [this.recipe1(), this.recipe2(), this.recipe3()],
        kitchen_about: this.kitchenAbout(),
        sidebar_about: this.sidebarAbout(),
      };
      await this.settingsService.saveKitchenHomeSettings(payload);
      this.snackBar.open('Kitchen Home settings saved successfully!', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Failed to save Kitchen Home settings', err);
      this.snackBar.open('Failed to save settings. Please try again.', 'Close', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }
}
