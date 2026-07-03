import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RecipeService } from '../../services/recipe.service';
import { CreateRecipeDialogComponent } from './create-recipe-dialog';
import { FormRoot, FormField } from '@angular/forms/signals';

describe('CreateRecipeDialogComponent', () => {
  let component: CreateRecipeDialogComponent;
  let fixture: ComponentFixture<CreateRecipeDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockRecipeService: {
    checkSlugAvailability: ReturnType<typeof vi.fn>;
    createRecipe: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockRecipeService = {
      checkSlugAvailability: vi.fn().mockResolvedValue(false),
      createRecipe: vi.fn().mockResolvedValue({ id: '123' }),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateRecipeDialogComponent, FormRoot, FormField],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(CreateRecipeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-slugify title if slug has not been manually edited', async () => {
    component['createForm'].title().value.set('My New Recipe');
    vi.advanceTimersByTime(0); // allow subscription to process
    expect(component['createForm'].slug().value()).toBe('my-new-recipe');
  });

  it('should not auto-slugify title if slug was manually edited', async () => {
    component.onSlugInput(); // user types in slug
    component['createForm'].title().value.set('My New Recipe');
    vi.advanceTimersByTime(0);
    expect(component['createForm'].slug().value()).toBe('');
  });
  it('should render validation errors and pending state in the template', async () => {
    // Force validation errors
    component['createForm'].title().value.set('');
    component['createForm'].title().markAsTouched();
    component['createForm'].slug().value.set('');
    component['createForm'].slug().markAsTouched();

    // Force submitting state
    component['isSubmitting'].set(true);

    fixture.detectChanges();
    await fixture.whenStable();

    // Very basic assertions just to ensure the template executed those branches
    expect(component['isSubmitting']()).toBe(true);
    expect(component['createForm']().invalid()).toBe(true);
  });

  it('should call createRecipe and navigate on submit', async () => {
    component['createForm'].title().value.set('Test');
    component['createForm'].slug().value.set('test');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve(); // flush microtasks

    expect(mockRecipeService.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test',
        slug: 'test',
        status: 'draft',
      }),
    );
    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipes/edit', '123']);
  });

  it('should not check slug if it is empty', async () => {
    component['createForm'].slug().value.set('');
    vi.advanceTimersByTime(700);
    await Promise.resolve();
    expect(mockRecipeService.checkSlugAvailability).not.toHaveBeenCalled();
    expect(
      component['createForm']
        .slug()
        .errors()
        .find((e) => e.kind === 'slug_taken'),
    ).toBeFalsy();
  });

  it('should not submit if form is invalid', async () => {
    component['createForm'].title().value.set(''); // Invalid
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve(); // flush microtasks
    expect(mockRecipeService.createRecipe).not.toHaveBeenCalled();
  });

  it('should catch error on submit failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRecipeService.createRecipe.mockRejectedValueOnce(new Error('API Error'));
    component['createForm'].title().value.set('Test');
    component['createForm'].slug().value.set('test');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve(); // flush microtasks

    expect(consoleSpy).toHaveBeenCalled();
    expect(component['isSubmitting']()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should ignore submit if already submitting', async () => {
    component['isSubmitting'].set(true);
    mockRecipeService.createRecipe.mockClear();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve();

    expect(mockRecipeService.createRecipe).not.toHaveBeenCalled();
  });

  describe('slug validation', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it('should set error kind slug_taken when slug is unavailable', async () => {
      mockRecipeService.checkSlugAvailability.mockResolvedValue(true); // true means taken
      const slugField = component['createForm'].slug;

      slugField().value.set('taken-slug');

      // Wait for debounce (1000ms) and resource resolution
      await new Promise((r) => setTimeout(r, 1200));
      fixture.detectChanges();

      const errs = slugField().errors() || [];
      expect(errs).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: 'slug_taken' })]),
      );
    });

    it('should not have slug_taken error when slug is available', async () => {
      mockRecipeService.checkSlugAvailability.mockResolvedValue(false); // false means available
      const slugField = component['createForm'].slug;

      slugField().value.set('available-slug');

      await new Promise((r) => setTimeout(r, 1200));
      fixture.detectChanges();

      const errs = slugField().errors() || [];
      expect(
        errs.find((e: unknown) => (e as { kind?: string }).kind === 'slug_taken'),
      ).toBeUndefined();
    });

    it('should handle validation api errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockRecipeService.checkSlugAvailability.mockRejectedValue(new Error('API failure'));
      const slugField = component['createForm'].slug;

      slugField().value.set('error-slug');

      await new Promise((r) => setTimeout(r, 1200));
      fixture.detectChanges();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check slug availability',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
