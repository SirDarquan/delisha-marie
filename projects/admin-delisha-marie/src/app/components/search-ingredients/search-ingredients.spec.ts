import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchIngredientsComponent } from './search-ingredients';

describe('SearchIngredientsComponent', () => {
  let component: SearchIngredientsComponent;
  let fixture: ComponentFixture<SearchIngredientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchIngredientsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchIngredientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search ingredients', () => {
    expect(component.searchIngredients()).toEqual([]);
  });

  it('should add an ingredient', () => {
    component.addIngredient('Catfish');
    expect(component.searchIngredients()).toEqual(['Catfish']);

    component.addIngredient();
    expect(component.searchIngredients()).toEqual(['Catfish', '']);
  });

  it('should remove an ingredient by index', () => {
    component.value.set(['Catfish', 'Ginger', 'Olive Oil']);
    component.removeIngredient(1);
    expect(component.searchIngredients()).toEqual(['Catfish', 'Olive Oil']);
  });

  it('should update an ingredient value on input', () => {
    component.value.set(['Catfish']);
    const mockEvent = {
      target: { value: 'Wild Catfish' } as unknown as HTMLInputElement,
    } as unknown as Event;

    component.onIngredientInput(0, mockEvent);
    expect(component.searchIngredients()).toEqual(['Wild Catfish']);
  });

  it('should emit autoDetect output when clicked', () => {
    let emitted = false;
    component.autoDetect.subscribe(() => {
      emitted = true;
    });

    component.autoDetect.emit();
    expect(emitted).toBe(true);
  });

  it('should trigger autoDetect when Auto-Detect button is clicked in template', () => {
    let emitted = false;
    component.autoDetect.subscribe(() => {
      emitted = true;
    });
    const autoDetectBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Auto-detect search ingredients from text"]',
    ) as HTMLButtonElement;
    autoDetectBtn.click();
    expect(emitted).toBe(true);
  });

  it('should add ingredient when Add Ingredient button is clicked in template', () => {
    const addBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Add custom search ingredient tag"]',
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(component.searchIngredients()).toEqual(['']);
  });

  it('should remove ingredient when chip remove button is clicked in template', () => {
    component.value.set(['Pepper', 'Salt']);
    fixture.detectChanges();
    const removeButtons = fixture.nativeElement.querySelectorAll('button[aria-label^="Remove"]');
    (removeButtons[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.searchIngredients()).toEqual(['Salt']);
  });

  it('should update ingredient value when input event fires on chip input in template', () => {
    component.value.set(['Pepper']);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Ingredient..."]',
    ) as HTMLInputElement;
    input.value = 'Black Pepper';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.searchIngredients()).toEqual(['Black Pepper']);
  });

  it('should display empty message when there are no search ingredients', () => {
    component.value.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No search ingredients added');
  });

  it('should handle undefined or null value in methods gracefully', () => {
    component.value.set(null as unknown as string[]);
    expect(component.searchIngredients()).toEqual([]);
    component.addIngredient('Garlic');
    expect(component.searchIngredients()).toEqual(['Garlic']);
    component.removeIngredient(0);
    expect(component.searchIngredients()).toEqual([]);
  });
});
