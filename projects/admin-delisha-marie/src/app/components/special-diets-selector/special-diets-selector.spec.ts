import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeService } from '../../services/recipe.service';
import { SpecialDietsSelectorComponent } from './special-diets-selector';

describe('SpecialDietsSelectorComponent', () => {
  let component: SpecialDietsSelectorComponent;
  let fixture: ComponentFixture<SpecialDietsSelectorComponent>;
  let emittedValues: string[] | null = null;

  const mockRecipesSignal = signal<unknown[]>([
    { title: 'A', slug: 'a', specialDiets: ['Gluten Free', 'Vegan'], status: 'published' },
    { title: 'B', slug: 'b', specialDiets: ['Low Carb'], status: 'published' },
    { title: 'C', slug: 'c', specialDiets: ['Gluten Free'], status: 'published' },
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
  };

  beforeEach(async () => {
    emittedValues = null;

    await TestBed.configureTestingModule({
      imports: [SpecialDietsSelectorComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialDietsSelectorComponent);
    component = fixture.componentInstance;

    component.dietsChange.subscribe((val) => {
      emittedValues = val;
    });
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compile existing diets from database alphabetically', () => {
    fixture.detectChanges();
    const compiled = component.compiledDiets();

    expect(compiled).toContain('Gluten Free');
    expect(compiled).toContain('Vegan');
    expect(compiled).toContain('Low Carb');

    // Check sorting
    expect(compiled.indexOf('Gluten Free')).toBeLessThan(compiled.indexOf('Low Carb'));
    expect(compiled.indexOf('Low Carb')).toBeLessThan(compiled.indexOf('Vegan'));
  });

  it('should sync with initialDiets input', () => {
    fixture.componentRef.setInput('initialDiets', ['Vegan', 'Keto']);
    fixture.detectChanges();
    expect(component.selectedDiets()).toEqual(['Vegan', 'Keto']);
    expect(component.compiledDiets()).toContain('Keto');
  });

  it('should emit changes when select is changed', () => {
    fixture.detectChanges();
    component.onSelectionChange(['Vegan', 'Low Carb']);

    expect(component.selectedDiets()).toEqual(['Vegan', 'Low Carb']);
    expect(emittedValues).toEqual(['Vegan', 'Low Carb']);
    expect(component.showCustomInput()).toBe(false);
  });

  it('should open custom diet input when custom is in values and strip custom from choice list', () => {
    fixture.detectChanges();
    component.onSelectionChange(['Vegan', 'custom']);
    fixture.detectChanges();

    expect(component.showCustomInput()).toBe(true);
    expect(component.selectedDiets()).toEqual(['Vegan']);
    expect(emittedValues).toEqual(['Vegan']);
    expect(component.customDietText()).toBe('');
  });

  it('should support typing, adding, and emitting a custom dietary profile', () => {
    fixture.detectChanges();
    // 1. Intercept custom select
    component.onSelectionChange(['Vegan', 'custom']);
    fixture.detectChanges();
    expect(component.showCustomInput()).toBe(true);

    // 2. Type text
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    fixture.detectChanges();
    expect(component.customDietText()).toBe('Nut Free');

    // 3. Add custom diet
    component.addCustomDiet();
    fixture.detectChanges();
    expect(component.selectedDiets()).toEqual(['Vegan', 'Nut Free']);
    expect(emittedValues).toEqual(['Vegan', 'Nut Free']);
    expect(component.compiledDiets()).toContain('Nut Free');
    expect(component.showCustomInput()).toBe(false);
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialDiets', ['Gluten Free']);
    fixture.detectChanges();

    component.onSelectionChange(['Gluten Free', 'custom']);
    fixture.detectChanges();
    component.onCustomTextChange({ target: { value: 'Dairy Free' } } as unknown as Event);
    fixture.detectChanges();

    component.cancelCustomDiet();
    fixture.detectChanges();
    expect(component.showCustomInput()).toBe(false);
    expect(component.selectedDiets()).toEqual(['Gluten Free']);
  });

  it('should not duplicate custom diet in compiledDiets if added again', () => {
    fixture.detectChanges();
    component.onSelectionChange(['Vegan', 'custom']);
    fixture.detectChanges();

    // Add once
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    component.addCustomDiet();
    fixture.detectChanges();

    // Add again
    component.onSelectionChange(['Vegan', 'Nut Free', 'custom']);
    fixture.detectChanges();
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    component.addCustomDiet();
    fixture.detectChanges();

    const matches = component.compiledDiets().filter((d) => d === 'Nut Free');
    expect(matches.length).toBe(1);
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should ignore empty or null specialDiets in database or localCustomDiets lists', () => {
    mockRecipesSignal.set([
      { title: 'A', slug: 'a', specialDiets: ['Gluten Free', ''] }, // empty string
      { title: 'B', slug: 'b', specialDiets: null as unknown as string[] }, // null list
      { title: 'C', slug: 'c', specialDiets: ['Vegan', null as unknown as string] }, // null item
    ]);
    component.localCustomDiets.set(['', null as unknown as string, '  ', 'Dairy Free']);
    fixture.detectChanges();

    const compiled = component.compiledDiets();
    expect(compiled).toContain('Gluten Free');
    expect(compiled).toContain('Vegan');
    expect(compiled).toContain('Dairy Free');
    expect(compiled.includes('')).toBe(false);
  });

  it('should return early in addCustomDiet if trimmed value is empty', () => {
    component.customDietText.set('   ');
    const spy = vi.spyOn(component.localCustomDiets, 'update');
    component.addCustomDiet();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should click template Add and Cancel buttons', () => {
    fixture.detectChanges();
    component.onSelectionChange(['custom']);
    fixture.detectChanges();

    // 1. Enter text
    component.onCustomTextChange({ target: { value: 'Keto' } } as unknown as Event);
    fixture.detectChanges();

    // Find and click Add button in UI
    const addBtn = fixture.nativeElement.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    expect(addBtn).toBeTruthy();
    addBtn.click();
    fixture.detectChanges();

    expect(component.selectedDiets()).toEqual(['Keto']);
    expect(component.showCustomInput()).toBe(false);

    // 2. Select custom again, then click Cancel button in UI
    component.onSelectionChange(['custom']);
    fixture.detectChanges();

    const cancelBtn = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.showCustomInput()).toBe(false);
  });

  it('should handle fallback or undefined selectField / initialDiets / initial values (lines 185, 187, 200, 217)', () => {
    // 1. Line 185: initial is null/undefined
    fixture.componentRef.setInput('initialDiets', null as unknown as string[]);
    fixture.detectChanges();
    expect(component.compiledDiets()).toBeTruthy();

    // 2. Line 187: initial has null or empty diets
    fixture.componentRef.setInput('initialDiets', ['', null as unknown as string, '  ']);
    fixture.detectChanges();
    expect(component.compiledDiets()).toBeTruthy();

    // 3. Line 200: inside constructor effect, initial is null
    fixture.componentRef.setInput('initialDiets', null as unknown as string[]);
    fixture.detectChanges();

    // 4. Line 217: selectField is undefined inside onSelectionChange
    // @ts-expect-error - mock selectField to undefined
    component.selectField = (() => undefined) as unknown as typeof component.selectField;
    component.onSelectionChange(['custom']);
    expect(component.showCustomInput()).toBe(true);
  });
});
