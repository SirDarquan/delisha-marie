import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { RecipeService } from '../../services/recipe.service';
import { CookingMethodSelectorComponent } from './cooking-method-selector';

describe('CookingMethodSelectorComponent', () => {
  let component: CookingMethodSelectorComponent;
  let fixture: ComponentFixture<CookingMethodSelectorComponent>;
  let emittedValue: string | null = null;

  const mockRecipesSignal = signal<unknown[]>([
    { title: 'A', slug: 'a', method: 'Smoking', status: 'published' },
    { title: 'B', slug: 'b', method: 'Sous Vide', status: 'published' },
    { title: 'C', slug: 'c', method: 'Baking', status: 'published' },
  ]);

  const mockMethodsSignal = signal<{ id: string; name: string; slug: string }[]>([
    { id: '1', name: 'Air Frying', slug: 'air-frying' },
    { id: '2', name: 'Baking', slug: 'baking' },
    { id: '3', name: 'Grilling', slug: 'grilling' },
    { id: '4', name: 'No Bake', slug: 'no-bake' },
    { id: '5', name: 'Sautéing', slug: 'sauteing' },
    { id: '6', name: 'Slow Cooking', slug: 'slow-cooking' },
    { id: '7', name: 'Stovetop', slug: 'stovetop' },
    { id: '8', name: 'Smoking', slug: 'smoking' },
    { id: '9', name: 'Sous Vide', slug: 'sous-vide' },
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
    methods: mockMethodsSignal,
  };

  beforeEach(async () => {
    emittedValue = null;

    await TestBed.configureTestingModule({
      imports: [CookingMethodSelectorComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CookingMethodSelectorComponent);
    component = fixture.componentInstance;

    component.methodChange.subscribe((val) => {
      emittedValue = val;
    });
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compile existing methods from database', () => {
    fixture.detectChanges();
    const compiled = component.compiledMethods();

    // Custom database methods
    expect(compiled).toContain('Smoking');
    expect(compiled).toContain('Sous Vide');
    expect(compiled).toContain('Baking');

    // Seed defaults are now included as baselines
    expect(compiled).toContain('Grilling');
    expect(compiled).toContain('Sautéing');

    // Random non-existent methods are not included
    expect(compiled).not.toContain('Poaching');

    // Sorted alphabetically
    expect(compiled[0] <= compiled[1]).toBe(true);
  });

  it('should sync with initialMethod input', () => {
    fixture.componentRef.setInput('initialMethod', 'Roasting');
    fixture.detectChanges();
    expect(component.selectedMethod()).toBe('Roasting');
  });

  it('should emit select changes for predefined methods', () => {
    fixture.detectChanges();
    component.onMethodSelect('Smoking');

    expect(component.selectedMethod()).toBe('Smoking');
    expect(emittedValue).toBe('Smoking');
  });

  it('should support entering, adding, and emitting a custom method', async () => {
    fixture.detectChanges();
    // 1. Type text
    component.onCustomTextChange({ target: { value: 'Dehydrating' } } as unknown as Event);
    fixture.detectChanges();
    expect(component.customMethodText()).toBe('Dehydrating');

    // 2. Click add
    component.addCustomMethod();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.selectedMethod()).toBe('Dehydrating');
    expect(emittedValue).toBe('Dehydrating');
    expect(component.compiledMethods()).toContain('Dehydrating');
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialMethod', 'Sous Vide');
    fixture.detectChanges();

    component.onCustomTextChange({ target: { value: 'Smoking' } } as unknown as Event);
    fixture.detectChanges();

    // Cancel
    component.cancelCustomMethod();
    fixture.detectChanges();
    expect(component.customMethodText()).toBe('');
  });

  it('should not duplicate custom method in compiledMethods if added again', async () => {
    fixture.detectChanges();

    // Add once
    component.onCustomTextChange({ target: { value: 'Smoking' } } as unknown as Event);
    component.addCustomMethod();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    // Add again
    component.onCustomTextChange({ target: { value: 'Smoking' } } as unknown as Event);
    component.addCustomMethod();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    // Smoking is in the list only once
    const matches = component.compiledMethods().filter((m) => m === 'Smoking');
    expect(matches.length).toBe(1);
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should ignore empty or null methods in database or localCustomMethods lists', () => {
    mockRecipesSignal.set([
      { title: 'A', slug: 'a', method: 'Smoking' },
      { title: 'B', slug: 'b', method: '' }, // empty
      { title: 'C', slug: 'c', method: null as unknown as string }, // null
    ]);
    component.localCustomMethods.set(['', null as unknown as string, '  ', 'Baking']);
    fixture.detectChanges();

    const compiled = component.compiledMethods();
    expect(compiled).toContain('Smoking');
    expect(compiled).toContain('Baking');
    expect(compiled.includes('')).toBe(false);
  });

  it('should return early in addCustomMethod if trimmed value is empty', () => {
    component.customMethodText.set('   ');
    const spy = vi.spyOn(component.localCustomMethods, 'update');
    component.addCustomMethod();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should click template Add and Cancel buttons', async () => {
    fixture.detectChanges();

    // 1. Enter text
    component.onCustomTextChange({ target: { value: 'Grilling' } } as unknown as Event);
    fixture.detectChanges();

    // Find and click Add button in UI
    const addBtn = fixture.nativeElement.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    expect(addBtn).toBeTruthy();
    addBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.selectedMethod()).toBe('Grilling');

    // Click Cancel button in UI
    const cancelBtn = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();
    expect(component.customMethodText()).toBe('');
  });

  it('should bind the required input to the mat-select required property', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    const selectDebug = fixture.debugElement.query(By.css('mat-select'));
    expect(selectDebug).toBeTruthy();
    const selectInstance = selectDebug.componentInstance as MatSelect;
    expect(selectInstance.required).toBe(true);
  });

  it('should prepopulate compiledMethods with baseline methods', () => {
    fixture.detectChanges();
    const compiled = component.compiledMethods();
    expect(compiled).toContain('Air Frying');
    expect(compiled).toContain('Baking');
    expect(compiled).toContain('Grilling');
    expect(compiled).toContain('No Bake');
    expect(compiled).toContain('Sautéing');
    expect(compiled).toContain('Slow Cooking');
    expect(compiled).toContain('Stovetop');
  });
});
