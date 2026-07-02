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

  const mockSpecialDietsSignal = signal<{ id: string; name: string }[]>([
    { id: '1', name: 'Dairy-Free' },
    { id: '2', name: 'Keto' },
    { id: '3', name: 'Vegan' },
    { id: '4', name: 'Gluten Free' },
    { id: '5', name: 'Low Carb' },
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
    specialDiets: mockSpecialDietsSignal,
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

  it('should sync with value input', () => {
    fixture.componentRef.setInput('value', ['Vegan', 'Keto']);
    fixture.detectChanges();
    expect(component.selectedDiets()).toEqual(['Vegan', 'Keto']);
    expect(component.compiledDiets()).toContain('Keto');
  });

  it('should emit changes when select is changed', () => {
    fixture.detectChanges();
    component.onSelectionChange(['Vegan', 'Low Carb']);

    expect(component.selectedDiets()).toEqual(['Vegan', 'Low Carb']);
    expect(emittedValues).toEqual(['Vegan', 'Low Carb']);
  });

  it('should support typing, adding, and emitting a custom dietary profile', async () => {
    fixture.componentRef.setInput('value', ['Vegan']);
    fixture.detectChanges();
    // 1. Type text
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    fixture.detectChanges();
    expect(component.customDietText()).toBe('Nut Free');

    // 2. Add custom diet
    component.addCustomDiet();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(component.selectedDiets()).toEqual(['Vegan', 'Nut Free']);
    expect(emittedValues).toEqual(['Vegan', 'Nut Free']);
    expect(component.compiledDiets()).toContain('Nut Free');
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('value', ['Gluten Free']);
    fixture.detectChanges();

    component.onCustomTextChange({ target: { value: 'Dairy Free' } } as unknown as Event);
    fixture.detectChanges();

    component.cancelCustomDiet();
    fixture.detectChanges();
    expect(component.customDietText()).toBe('');
  });

  it('should not duplicate custom diet in compiledDiets if added again', async () => {
    fixture.detectChanges();

    // Add once
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    component.addCustomDiet();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    // Add again
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as unknown as Event);
    component.addCustomDiet();
    await new Promise((resolve) => setTimeout(resolve, 0));
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

  it('should click template Add and Cancel buttons', async () => {
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.selectedDiets()).toEqual(['Keto']);

    // Click Cancel button in UI
    const cancelBtn = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();
    expect(component.customDietText()).toBe('');
  });

  it('should handle fallback selectField inside onSelectionChange (line 217)', () => {
    fixture.detectChanges();
    // @ts-expect-error - mock selectField to undefined
    component.selectField = (() => undefined) as unknown as typeof component.selectField;
    expect(() => component.onSelectionChange(['Vegan'])).not.toThrow();
  });

  it('should prepopulate compiledDiets with baseline diets from service', () => {
    fixture.detectChanges();
    const compiled = component.compiledDiets();
    expect(compiled).toContain('Dairy-Free');
    expect(compiled).toContain('Keto');
    expect(compiled).toContain('Vegan');
  });

  it('should ignore empty string diets when compiling', () => {
    mockSpecialDietsSignal.set([{ id: '99', name: '   ' }]);
    fixture.componentRef.setInput('value', ['   ', 'Valid Diet']);
    fixture.detectChanges();

    component.localCustomDiets.set(['   ']);
    const compiled = component.compiledDiets();
    expect(compiled).toContain('Valid Diet');
    expect(compiled).not.toContain('');
    expect(compiled).not.toContain('   ');
  });

  it('should not add custom diet if it already exists in local list or selected', async () => {
    component.localCustomDiets.set(['Keto']);
    fixture.componentRef.setInput('value', ['Keto']);
    fixture.detectChanges();

    component.customDietText.set('Keto');
    component.addCustomDiet();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.localCustomDiets()).toEqual(['Keto']); // Should not duplicate
    expect(component.selectedDiets()).toEqual(['Keto']); // Should not duplicate
  });
});
