import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { RecipesListComponent, ADMIN_BRAND_TOKEN } from './recipes-list';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
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
    },
  ]);

  let deletedId: string | number | null = null;
  let logoutCalled = false;
  let navigated: unknown[] = [];

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
    deleteRecipe: (id: string | number) => {
      deletedId = id;
      return true;
    },
  };

  const fakeAuthService = {
    logout: () => {
      logoutCalled = true;
    },
  };

  beforeEach(async () => {
    deletedId = null;
    logoutCalled = false;
    navigated = [];
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
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [RecipesListComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: fakeRecipeService },
        { provide: AuthService, useValue: fakeAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesListComponent);
    component = fixture.componentInstance;

    // Overwrite the real Router's navigate method
    const router = TestBed.inject(Router);
    router.navigate = (commands: unknown[]) => {
      navigated = commands;
      return Promise.resolve(true);
    };

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

  it('should call logout and navigate to login', () => {
    component.onLogout();
    expect(logoutCalled).toBe(true);
    expect(navigated).toEqual(['/login']);
  });

  it('should render no results message when search returns empty', () => {
    mockRecipesSignal.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No recipes found.');
  });

  it('should accept custom brand title token', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RecipesListComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: fakeRecipeService },
        { provide: AuthService, useValue: fakeAuthService },
        { provide: ADMIN_BRAND_TOKEN, useValue: 'Super Admin' },
      ],
    }).compileComponents();

    const fix = TestBed.createComponent(RecipesListComponent);
    fix.detectChanges();
    expect(fix.componentInstance['brandTitle']).toBe('Super Admin');
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
      },
    ]);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/pasta.jpg');
  });
});
