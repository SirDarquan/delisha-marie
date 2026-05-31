import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HolidaysSelectorComponent } from './holidays-selector';
import { RecipeService } from '../../services/recipe.service';
import { signal } from '@angular/core';

describe('HolidaysSelectorComponent', () => {
  let component: HolidaysSelectorComponent;
  let fixture: ComponentFixture<HolidaysSelectorComponent>;
  let emittedValue: string | null = null;

  const mockRecipesSignal = signal<unknown[]>([
    { title: 'A', slug: 'a', holidays: ['Thanksgiving', 'Christmas'], status: 'published' },
    { title: 'B', slug: 'b', holidays: ['Sunday Roast'], status: 'published' },
    { title: 'C', slug: 'c', holidays: ['Thanksgiving'], status: 'published' },
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
  };

  beforeEach(async () => {
    emittedValue = null;

    await TestBed.configureTestingModule({
      imports: [HolidaysSelectorComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HolidaysSelectorComponent);
    component = fixture.componentInstance;

    component.holidayChange.subscribe((val) => {
      emittedValue = val;
    });
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compile existing holidays from database alphabetically', () => {
    fixture.detectChanges();
    const compiled = component.compiledHolidays();

    expect(compiled).toContain('Thanksgiving');
    expect(compiled).toContain('Christmas');
    expect(compiled).toContain('Sunday Roast');

    // Check sorting
    expect(compiled.indexOf('Christmas')).toBeLessThan(compiled.indexOf('Sunday Roast'));
    expect(compiled.indexOf('Sunday Roast')).toBeLessThan(compiled.indexOf('Thanksgiving'));
  });

  it('should sync with initialHoliday input', () => {
    fixture.componentRef.setInput('initialHoliday', 'Halloween');
    fixture.detectChanges();
    expect(component.selectedHoliday()).toBe('Halloween');
    expect(component.compiledHolidays()).toContain('Halloween');
  });

  it('should emit changes when select is changed', () => {
    fixture.detectChanges();
    component.onHolidaySelect('Christmas');

    expect(component.selectedHoliday()).toBe('Christmas');
    expect(emittedValue).toBe('Christmas');
    expect(component.showCustomInput()).toBe(false);
  });

  it('should open custom holiday input when custom is selected', () => {
    fixture.detectChanges();
    component.onHolidaySelect('custom');

    expect(component.showCustomInput()).toBe(true);
    expect(component.customHolidayText()).toBe('');
  });

  it('should support typing, adding, and emitting a custom holiday', () => {
    fixture.detectChanges();
    // 1. Select custom option
    component.onHolidaySelect('custom');
    expect(component.showCustomInput()).toBe(true);

    // 2. Type text
    component.onCustomTextChange({ target: { value: 'New Year' } } as unknown as Event);
    expect(component.customHolidayText()).toBe('New Year');

    // 3. Add custom holiday
    component.addCustomHoliday();
    expect(component.selectedHoliday()).toBe('New Year');
    expect(emittedValue).toBe('New Year');
    expect(component.compiledHolidays()).toContain('New Year');
    expect(component.showCustomInput()).toBe(false);
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialHoliday', 'Thanksgiving');
    fixture.detectChanges();

    component.onHolidaySelect('custom');
    component.onCustomTextChange({ target: { value: 'Fourth of July' } } as unknown as Event);

    component.cancelCustomHoliday();
    expect(component.showCustomInput()).toBe(false);
    expect(component.selectedHoliday()).toBe('Thanksgiving');
  });
});
