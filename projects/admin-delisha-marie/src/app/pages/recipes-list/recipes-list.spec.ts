import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { RecipesListComponent } from './recipes-list';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';

describe('RecipesListComponent', () => {
  let component: RecipesListComponent;
  let fixture: ComponentFixture<RecipesListComponent>;

  const mockRecipesSignal = signal<Recipe[]>([
    {
      id: 1,
      title: 'Pasta',
      slug: 'pasta',
      description: 'Tasty',
      content: 'Sample',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'published',
    },
  ]);

  let deletedId: string | number | null = null;

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
    deleteRecipe: (id: string | number) => {
      deletedId = id;
      return true;
    },
  };

  beforeEach(async () => {
    deletedId = null;
    mockRecipesSignal.set([
      {
        id: 1,
        title: 'Pasta',
        slug: 'pasta',
        description: 'Tasty',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: '',
        prepTime: '',
        cookTime: '',
        difficulty: 'Easy',
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        status: 'published',
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [RecipesListComponent],
      providers: [provideRouter([]), { provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesListComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should filter recipes based on search term matching category', () => {
    mockRecipesSignal.set([
      {
        id: 1,
        title: 'Pasta',
        slug: 'pasta',
        description: 'Tasty',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: '',
        prepTime: '',
        cookTime: '',
        difficulty: 'Easy',
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        category: 'Dinner',
        status: 'published',
      },
    ]);

    component.onSearchChange({ target: { value: 'dinner' } } as unknown as Event);
    expect(component['filteredRecipes']().length).toBe(1);

    component.onSearchChange({ target: { value: 'lunch' } } as unknown as Event);
    expect(component['filteredRecipes']().length).toBe(0);
  });

  it('should not delete recipe if confirm is false', () => {
    const originalConfirm = window.confirm;
    window.confirm = () => false;
    component.onDelete(1);
    expect(deletedId).toBeNull();
    window.confirm = originalConfirm;
  });

  it('should call deleteRecipe on delete callback when confirmed', () => {
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    component.onDelete(1);
    expect(deletedId).toBe(1);
    window.confirm = originalConfirm;
  });

  it('should render no results message when search returns empty', () => {
    mockRecipesSignal.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No recipes found.');
  });

  it('should render image when provided in recipe object', () => {
    mockRecipesSignal.set([
      {
        id: 1,
        title: 'Pasta',
        slug: 'pasta',
        description: 'Tasty',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: 'https://example.com/pasta.jpg',
        prepTime: '',
        cookTime: '',
        difficulty: 'Easy',
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        status: 'published',
      },
    ]);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/pasta.jpg');
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should click the delete button in the DOM and trigger onDelete', () => {
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    const deleteBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Delete recipe"]',
    ) as HTMLButtonElement;
    expect(deleteBtn).toBeTruthy();
    deleteBtn.click();
    fixture.detectChanges();

    expect(deletedId).toBe(1);
    window.confirm = originalConfirm;
  });

  it('should fallback difficulty to Easy if not provided', () => {
    mockRecipesSignal.set([
      {
        id: 1,
        title: 'Pasta',
        slug: 'pasta',
        description: 'Tasty',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: '',
        prepTime: '',
        cookTime: '',
        difficulty: '', // empty (falsy)
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        status: 'published',
      },
    ]);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('span.capitalize');
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('Easy');
  });
});
