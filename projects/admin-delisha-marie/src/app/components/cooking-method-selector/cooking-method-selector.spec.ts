import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CookingMethodSelectorComponent } from './cooking-method-selector';
import { RecipeService } from '../../services/recipe.service';
import { signal } from '@angular/core';

describe('CookingMethodSelectorComponent', () => {
  let component: CookingMethodSelectorComponent;
  let fixture: ComponentFixture<CookingMethodSelectorComponent>;
  let emittedValue: string | null = null;

  const mockRecipesSignal = signal<any[]>([
    { title: 'A', slug: 'a', method: 'Smoking', status: 'published' },
    { title: 'B', slug: 'b', method: 'Sous Vide', status: 'published' },
    { title: 'C', slug: 'c', method: 'Baking', status: 'published' }
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal
  };

  beforeEach(async () => {
    emittedValue = null;

    await TestBed.configureTestingModule({
      imports: [CookingMethodSelectorComponent],
      providers: [
        { provide: RecipeService, useValue: fakeRecipeService }
      ]
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
    
    // Seed defaults no longer included
    expect(compiled).not.toContain('Grilling');
    expect(compiled).not.toContain('Sautéing');
    
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
    expect(component.showCustomInput()).toBe(false);
  });

  it('should open custom method input when custom option is selected', () => {
    fixture.detectChanges();
    component.onMethodSelect('custom');
    
    expect(component.showCustomInput()).toBe(true);
    expect(component.customMethodText()).toBe('');
  });

  it('should support entering, adding, and emitting a custom method', () => {
    fixture.detectChanges();
    // 1. Select custom option
    component.onMethodSelect('custom');
    expect(component.showCustomInput()).toBe(true);
    
    // 2. Type text
    component.onCustomTextChange({ target: { value: 'Dehydrating' } } as any);
    expect(component.customMethodText()).toBe('Dehydrating');
    
    // 3. Click add
    component.addCustomMethod();
    expect(component.selectedMethod()).toBe('Dehydrating');
    expect(emittedValue).toBe('Dehydrating');
    expect(component.showCustomInput()).toBe(false);
    expect(component.compiledMethods()).toContain('Dehydrating');
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialMethod', 'Sous Vide');
    fixture.detectChanges();
    
    // 1. Select custom
    component.onMethodSelect('custom');
    component.onCustomTextChange({ target: { value: 'Smoking' } } as any);
    
    // 2. Cancel
    component.cancelCustomMethod();
    expect(component.showCustomInput()).toBe(false);
    expect(emittedValue).toBe('Sous Vide'); // Reverts to previous
  });
});
