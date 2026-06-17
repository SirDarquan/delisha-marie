import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeService } from '../../services/recipe.service';
import { HolidaysSelectorComponent } from './holidays-selector';

describe('HolidaysSelectorComponent', () => {
  let component: HolidaysSelectorComponent;
  let fixture: ComponentFixture<HolidaysSelectorComponent>;
  let emittedValue: string | null = null;

  const mockRecipesSignal = signal<unknown[]>([
    { title: 'A', slug: 'a', holidays: ['Thanksgiving', 'Christmas'], status: 'published' },
    { title: 'B', slug: 'b', holidays: ['Sunday Roast'], status: 'published' },
    { title: 'C', slug: 'c', holidays: ['Thanksgiving'], status: 'published' },
  ]);

  const mockHolidaysSignal = signal<{ id: string; name: string }[]>([
    { id: '1', name: 'Christmas' },
    { id: '2', name: 'Easter' },
    { id: '3', name: 'Thanksgiving' },
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
    holidays: mockHolidaysSignal,
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
  });

  it('should open custom holiday input when custom is selected', () => {
    fixture.detectChanges();
    component.onHolidaySelect('custom');
    fixture.detectChanges();

    expect(component.customHolidayText()).toBe('');
  });

  it('should support typing, adding, and emitting a custom holiday', () => {
    fixture.detectChanges();
    // 1. Select custom option
    component.onHolidaySelect('custom');
    fixture.detectChanges();

    // 2. Type text
    component.onCustomTextChange({ target: { value: 'New Year' } } as unknown as Event);
    fixture.detectChanges();
    expect(component.customHolidayText()).toBe('New Year');

    // 3. Add custom holiday
    component.addCustomHoliday();
    fixture.detectChanges();
    expect(component.selectedHoliday()).toBe('New Year');
    expect(emittedValue).toBe('New Year');
    expect(component.compiledHolidays()).toContain('New Year');
  });

  it('should support canceling custom method entry', () => {
    fixture.componentRef.setInput('initialHoliday', 'Thanksgiving');
    fixture.detectChanges();

    component.onHolidaySelect('custom');
    fixture.detectChanges();
    component.onCustomTextChange({ target: { value: 'Fourth of July' } } as unknown as Event);
    fixture.detectChanges();

    component.cancelCustomHoliday();
    fixture.detectChanges();
    expect(component.selectedHoliday()).toBe('Thanksgiving');
  });

  it('should not duplicate custom holiday in compiledHolidays if added again', () => {
    fixture.detectChanges();
    component.onHolidaySelect('custom');
    fixture.detectChanges();

    // Add once
    component.onCustomTextChange({ target: { value: 'New Year' } } as unknown as Event);
    component.addCustomHoliday();
    fixture.detectChanges();

    // Add again
    component.onHolidaySelect('custom');
    fixture.detectChanges();
    component.onCustomTextChange({ target: { value: 'New Year' } } as unknown as Event);
    component.addCustomHoliday();
    fixture.detectChanges();

    const matches = component.compiledHolidays().filter((h) => h === 'New Year');
    expect(matches.length).toBe(1);
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should ignore empty or null holidays in database or localCustomHolidays lists', () => {
    mockRecipesSignal.set([
      { title: 'A', slug: 'a', holidays: ['Thanksgiving', ''] }, // empty string
      { title: 'B', slug: 'b', holidays: null as unknown as string[] }, // null list
      { title: 'C', slug: 'c', holidays: ['Christmas', null as unknown as string] }, // null item
    ]);
    component.localCustomHolidays.set(['', null as unknown as string, '  ', 'Easter']);
    fixture.detectChanges();

    const compiled = component.compiledHolidays();
    expect(compiled).toContain('Thanksgiving');
    expect(compiled).toContain('Christmas');
    expect(compiled).toContain('Easter');
    expect(compiled.includes('')).toBe(false);
  });

  it('should return early in addCustomHoliday if trimmed value is empty', () => {
    component.customHolidayText.set('   ');
    const spy = vi.spyOn(component.localCustomHolidays, 'update');
    component.addCustomHoliday();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should click template Add and Cancel buttons', () => {
    fixture.detectChanges();
    component.onHolidaySelect('custom');
    fixture.detectChanges();

    // 1. Enter text
    component.onCustomTextChange({ target: { value: 'Labor Day' } } as unknown as Event);
    fixture.detectChanges();

    // Find and click Add button in UI
    const addBtn = fixture.nativeElement.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    expect(addBtn).toBeTruthy();
    addBtn.click();
    fixture.detectChanges();

    expect(component.selectedHoliday()).toBe('Labor Day');

    // 2. Select custom again, then click Cancel button in UI
    component.onHolidaySelect('custom');
    fixture.detectChanges();

    const cancelBtn = (
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();
  });

  it('should handle onHolidaySelect when selectField is undefined (line 207)', () => {
    fixture.detectChanges();
    // @ts-expect-error - mock the selectField signal to return undefined
    component.selectField = (() => undefined) as unknown as typeof component.selectField;

    // Call the method and assert it does not throw
    expect(() => component.onHolidaySelect('custom')).not.toThrow();
  });

  it('should prepopulate compiledHolidays with baseline holidays from service', () => {
    fixture.detectChanges();
    const compiled = component.compiledHolidays();
    expect(compiled).toContain('Christmas');
    expect(compiled).toContain('Easter');
    expect(compiled).toContain('Thanksgiving');
  });
});
