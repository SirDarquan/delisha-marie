import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipePrint } from './recipe-print';
import { createMockRecipe } from '../../utils/test-recipe';
import { Recipe } from '../../services/recipe.service';

describe('RecipePrint', () => {
  let component: RecipePrint;
  let fixture: ComponentFixture<RecipePrint>;

  const mockRecipe: Recipe = createMockRecipe({
    title: 'Test Print Recipe',
    slug: 'test-print-recipe',
    yield: '4 servings',
    prepTime: '15 mins',
    cookTime: '30 mins',
    totalTime: '45 mins',
    image: 'test-image.jpg',
    equipment: ['Pan', 'Spatula'],
    ingredients: ['1 cup flour', '2 eggs'],
    instructions: ['Mix', 'Bake'],
    notes: ['Delicious note'],
  });

  beforeEach(async () => {
    window.print = vi.fn();
    window.history.pushState({}, '', '/recipe/test-print-recipe/print');

    await TestBed.configureTestingModule({
      imports: [RecipePrint],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipePrint);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render recipe details when recipe is provided', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Print Recipe');
    expect(compiled.textContent).toContain('15 mins');
    expect(compiled.textContent).toContain('4 servings');
  });

  it('should toggle equipment visibility via checkbox', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Equipment is false by default
    expect(compiled.textContent).not.toContain('Spatula');

    // Toggle it on via checkbox (2nd checkbox)
    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    const eqCheckbox = checkboxes[1] as HTMLInputElement;
    eqCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Spatula');
  });

  it('should toggle image visibility via checkbox', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Image is true by default
    expect(compiled.querySelector('img')).toBeTruthy();

    // Toggle it off via checkbox (1st checkbox)
    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    const imageCheckbox = checkboxes[0] as HTMLInputElement;
    imageCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(compiled.querySelector('img')).toBeFalsy();
  });

  it('should toggle notes visibility via checkbox', () => {
    fixture.componentRef.setInput('recipe', mockRecipe);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Notes is true by default
    expect(compiled.textContent).toContain('Delicious note');

    // Toggle it off via checkbox (3rd checkbox)
    const checkboxes = compiled.querySelectorAll('input[type="checkbox"]');
    const notesCheckbox = checkboxes[2] as HTMLInputElement;
    notesCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(compiled.textContent).not.toContain('Delicious note');
  });

  it('should update text size classes through template buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.print-page');

    expect(container?.classList.contains('print-size-normal')).toBeTruthy();

    const buttons = compiled.querySelectorAll('.bg-gray-200 button');

    // Click 'larger' button (3rd button)
    (buttons[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(container?.classList.contains('print-size-larger')).toBeTruthy();

    // Click 'smaller' button (1st button)
    (buttons[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(container?.classList.contains('print-size-smaller')).toBeTruthy();

    // Click 'normal' button (2nd button)
    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(container?.classList.contains('print-size-normal')).toBeTruthy();
  });

  it('should call print on the window when printRecipe button is clicked', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const printBtn = compiled.querySelector(
      'button.bg-\\[var\\(--mat-sys-primary\\)\\]',
    ) as HTMLButtonElement;

    printBtn.click();
    expect(window.print).toHaveBeenCalled();
  });

  it('should format windowUrl correctly', () => {
    expect(component.windowUrl()).toBe('http://localhost:3000/recipe/test-print-recipe');
  });

  it('should not show image if recipe has no image', () => {
    fixture.componentRef.setInput('recipe', { ...mockRecipe, image: '' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')).toBeFalsy();
  });
});
