import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RecipeService } from '../../services/recipe.service';
import { CreateRecipeDialogComponent } from './create-recipe-dialog';
import { FormRoot, FormField } from '@angular/forms/signals';

describe('CreateRecipeDialogComponent', () => {
  let component: CreateRecipeDialogComponent;
  let fixture: ComponentFixture<CreateRecipeDialogComponent>;
  let mockDialogRef: any;
  let mockRecipeService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockRecipeService = {
      checkSlugAvailability: vi.fn().mockResolvedValue(false),
      createRecipe: vi.fn().mockResolvedValue({ id: '123' }),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateRecipeDialogComponent, NoopAnimationsModule, FormRoot, FormField],
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

  it('should check slug availability with debounce', async () => {
    component['createForm'].slug().value.set('test-slug');
    TestBed.flushEffects();
    vi.advanceTimersByTime(300);
    TestBed.flushEffects();
    expect(mockRecipeService.checkSlugAvailability).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400); // 700ms total
    TestBed.flushEffects();
    await Promise.resolve(); // flush microtasks for the resource loader
    expect(mockRecipeService.checkSlugAvailability).toHaveBeenCalledWith('test-slug');
  });

  it('should show error if slug is taken', async () => {
    mockRecipeService.checkSlugAvailability.mockResolvedValueOnce(true);
    component['createForm'].slug().value.set('taken-slug');
    TestBed.flushEffects();
    vi.advanceTimersByTime(700);
    TestBed.flushEffects();
    await Promise.resolve(); // flush microtasks
    
    // Using Angular's SignalForm, errors are in the control's errors array
    expect(component['createForm'].slug().errors().find(e => e.kind === 'slug_taken')).toBeTruthy();
  });

  it('should clear error if slug is available', async () => {
    mockRecipeService.checkSlugAvailability.mockResolvedValueOnce(false);
    component['createForm'].slug().value.set('available-slug');
    TestBed.flushEffects();
    vi.advanceTimersByTime(700);
    TestBed.flushEffects();
    await Promise.resolve(); // flush microtasks
    
    expect(component['createForm'].slug().errors().find(e => e.kind === 'slug_taken')).toBeFalsy();
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
    expect(component['createForm'].slug().errors().find(e => e.kind === 'slug_taken')).toBeFalsy();
  });

  it('should not submit if form is invalid', async () => {
    component['createForm'].title().value.set(''); // Invalid
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve(); // flush microtasks
    expect(mockRecipeService.createRecipe).not.toHaveBeenCalled();
  });

  it('should catch error on submit failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRecipeService.createRecipe.mockRejectedValueOnce(new Error('API Error'));
    component['createForm'].title().value.set('Test');
    component['createForm'].slug().value.set('test');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', new Event('submit'));
    await Promise.resolve(); // flush microtasks

    expect(consoleSpy).toHaveBeenCalled();
    expect(component['isSubmitting']()).toBe(false);
    consoleSpy.mockRestore();
  });
});
