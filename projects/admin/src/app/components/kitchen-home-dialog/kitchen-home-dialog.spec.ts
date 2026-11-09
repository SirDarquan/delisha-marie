import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KitchenHomeDialogComponent } from './kitchen-home-dialog';
import { SettingsService, KitchenHomeSettings } from '../../services/settings.service';
import { RecipeService } from '../../services/recipe.service';

describe('KitchenHomeDialogComponent', () => {
  let component: KitchenHomeDialogComponent;
  let fixture: ComponentFixture<KitchenHomeDialogComponent>;
  let settingsServiceSpy: {
    getKitchenHomeSettings: ReturnType<typeof vi.fn>;
  };
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let recipeServiceSpy: { upload: ReturnType<typeof vi.fn> };

  const mockSettings: KitchenHomeSettings = {
    featuredRecipes: ['/recipes/pasta', '/recipes/cake', '/recipes/pie'],
    kitchen_about: 'custom_kitchen.png',
    sidebar_about: 'custom_sidebar.png',
  };

  beforeEach(async () => {
    settingsServiceSpy = {
      getKitchenHomeSettings: vi.fn().mockResolvedValue(mockSettings),
    };
    dialogRefSpy = { close: vi.fn() };
    snackBarSpy = { open: vi.fn() };
    recipeServiceSpy = { upload: vi.fn().mockResolvedValue('/uploads/profile.webp') };

    await TestBed.configureTestingModule({
      imports: [KitchenHomeDialogComponent],
      providers: [
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: RecipeService, useValue: recipeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenHomeDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create and load settings on init into signal form model', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(settingsServiceSpy.getKitchenHomeSettings).toHaveBeenCalled();
    expect(component.recipe1()).toBe('/recipes/pasta');
    expect(component.recipe2()).toBe('/recipes/cake');
    expect(component.recipe3()).toBe('/recipes/pie');
    expect(component.kitchenAbout()).toBe('custom_kitchen.png');
    expect(component.sidebarAbout()).toBe('custom_sidebar.png');
    expect(component.model().recipe1).toBe('/recipes/pasta');
  });

  it('should handle getKitchenHomeSettings returning null/undefined gracefully', async () => {
    settingsServiceSpy.getKitchenHomeSettings.mockResolvedValue(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.recipe1()).toBe('');
    expect(component.kitchenAbout()).toBe('delisha_marie_profile_2.png');
    expect(component.sidebarAbout()).toBe('delisha_marie_profile.png');
  });

  it('should handle error when loading settings', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    settingsServiceSpy.getKitchenHomeSettings.mockRejectedValue(new Error('Network error'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load settings.', 'Close', {
      duration: 3000,
    });
    expect(component['isLoading']()).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('should close dialog when cancel button is clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelBtn = compiled.querySelector('[data-testid="btn-cancel"]') as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should close dialog when close header icon is clicked', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const closeBtn = compiled.querySelector(
      '[data-testid="btn-close-dialog"]',
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should update model on picture change events', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onKitchenAboutChange('updated_kitchen.png');
    expect(component.kitchenAbout()).toBe('updated_kitchen.png');

    component.onSidebarAboutChange('updated_sidebar.png');
    expect(component.sidebarAbout()).toBe('updated_sidebar.png');
  });

  it('should close dialog on save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    expect(component['isSaving']()).toBe(false);
  });
});
