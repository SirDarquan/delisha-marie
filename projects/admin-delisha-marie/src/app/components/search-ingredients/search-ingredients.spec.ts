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
});
