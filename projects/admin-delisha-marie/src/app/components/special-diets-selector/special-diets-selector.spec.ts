import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpecialDietsSelectorComponent } from './special-diets-selector';
import { RecipeService } from '../../services/recipe.service';
import { signal } from '@angular/core';

describe('SpecialDietsSelectorComponent', () => {
  let component: SpecialDietsSelectorComponent;
  let fixture: ComponentFixture<SpecialDietsSelectorComponent>;
  let emittedValues: string[] | null = null;

  const mockRecipesSignal = signal<any[]>([
    { title: 'A', slug: 'a', specialDiets: ['Gluten Free', 'Vegan'], status: 'published' },
    { title: 'B', slug: 'b', specialDiets: ['Low Carb'], status: 'published' },
    { title: 'C', slug: 'c', specialDiets: ['Gluten Free'], status: 'published' }
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal
  };

  beforeEach(async () => {
    emittedValues = null;

    await TestBed.configureTestingModule({
      imports: [SpecialDietsSelectorComponent],
      providers: [
        { provide: RecipeService, useValue: fakeRecipeService }
      ]
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
    
    expect(component.showCustomInput()).toBe(true);
    expect(component.selectedDiets()).toEqual(['Vegan']);
    expect(emittedValues).toEqual(['Vegan']);
    expect(component.customDietText()).toBe('');
  });

  it('should support typing, adding, and emitting a custom dietary profile', () => {
    fixture.detectChanges();
    // 1. Intercept custom select
    component.onSelectionChange(['Vegan', 'custom']);
    expect(component.showCustomInput()).toBe(true);
    
    // 2. Type text
    component.onCustomTextChange({ target: { value: 'Nut Free' } } as any);
    expect(component.customDietText()).toBe('Nut Free');
    
    // 3. Add custom diet
    component.addCustomDiet();
    expect(component.selectedDiets()).toEqual(['Vegan', 'Nut Free']);
    expect(emittedValues).toEqual(['Vegan', 'Nut Free']);
    expect(component.compiledDiets()).toContain('Nut Free');
    expect(component.showCustomInput()).toBe(false);
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialDiets', ['Gluten Free']);
    fixture.detectChanges();
    
    component.onSelectionChange(['Gluten Free', 'custom']);
    component.onCustomTextChange({ target: { value: 'Dairy Free' } } as any);
    
    component.cancelCustomDiet();
    expect(component.showCustomInput()).toBe(false);
    expect(component.selectedDiets()).toEqual(['Gluten Free']);
  });
});
