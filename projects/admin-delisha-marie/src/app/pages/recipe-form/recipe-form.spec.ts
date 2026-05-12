import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeFormComponent } from './recipe-form';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';

describe('RecipeFormComponent', () => {
  let component: RecipeFormComponent;
  let fixture: ComponentFixture<RecipeFormComponent>;

  let mockRecipeById: Recipe | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createPayload: any = null;
  let updateId: string | number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updatePayload: any = null;
  let navigated: unknown[] = [];
  let routeParams: Record<string, string> = {};

  const fakeRecipeService = {
    getRecipeByIdOrSlug: (id: string | number) => {
      return id ? mockRecipeById : null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRecipe: (payload: any) => {
      createPayload = payload;
      return { id: 1, ...payload };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateRecipe: (id: string | number, payload: any) => {
      updateId = id;
      updatePayload = payload;
      return { id, ...payload };
    },
  };

  const fakeRouter = {
    navigate: (commands: unknown[]) => {
      navigated = commands;
    },
  };

  const fakeActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => routeParams[key] || null,
      },
    },
  };

  beforeEach(async () => {
    mockRecipeById = null;
    createPayload = null;
    updateId = null;
    updatePayload = null;
    navigated = [];
    routeParams = {};

    await TestBed.configureTestingModule({
      imports: [RecipeFormComponent, ReactiveFormsModule],
      providers: [
        { provide: RecipeService, useValue: fakeRecipeService },
        { provide: Router, useValue: fakeRouter },
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
  });

  it('should create the component for creation mode', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component['isEdit']()).toBe(false);
  });

  it('should populate edit form when parameter is provided', () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Mock Pasta',
      slug: 'mock-pasta',
      description: 'Mock test',
      content: 'Mock content',
      ingredients: ['A', 'B'],
      instructions: ['C'],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
    };

    fixture.detectChanges();

    expect(component['isEdit']()).toBe(true);
    expect(component['recipeForm'].value.title).toBe('Mock Pasta');
  });

  it('should submit form and call createRecipe', () => {
    fixture.detectChanges();
    component['recipeForm'].patchValue({
      title: 'Brand New',
      slug: 'brand-new',
      difficulty: 'Easy',
    });

    component.onSubmit();

    expect(createPayload).toBeTruthy();
    expect(createPayload.title).toBe('Brand New');
    expect(navigated).toEqual(['/recipes']);
  });

  it('should submit form and call updateRecipe when isEdit', () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Pasta',
      slug: 'pasta',
      description: 'mock description',
      content: 'mock content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
    };

    fixture.detectChanges();

    component['recipeForm'].patchValue({
      title: 'Pasta v2',
    });

    component.onSubmit();

    expect(updateId).toBe('1');
    expect(updatePayload.title).toBe('Pasta v2');
    expect(navigated).toEqual(['/recipes']);
  });

  it('should navigate back to recipes on onCancel', () => {
    fixture.detectChanges();
    component.onCancel();
    expect(navigated).toEqual(['/recipes']);
  });

  it('should handle edit mode when recipe is not found', () => {
    routeParams['id'] = 'notfound';
    mockRecipeById = null;
    fixture.detectChanges();
    expect(component['isEdit']()).toBe(true);
    expect(component['recipeForm'].value.title).toBe('');
  });

  it('should populate empty strings when edit source has undefined lists', () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Title',
      slug: 'slug',
      description: '',
      content: '',
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: '',
      // Omitted ingredients and instructions purposefully to trigger fallback branches
    } as unknown as Recipe;

    fixture.detectChanges();
    expect(component['recipeForm'].value.ingredients).toBe('');
    expect(component['recipeForm'].value.instructions).toBe('');
  });

  it('should handle whitespace cleaning and map empty values on form submission', () => {
    fixture.detectChanges();
    component['recipeForm'].patchValue({
      title: 'Trim Test',
      slug: 'trim-test',
      ingredients: '   \n Item 1 \n \n Item 2   ', // Should filter out blank lines, and trim spaces
      instructions: '', // Should return empty array
    });

    component.onSubmit();

    expect(createPayload.ingredients).toEqual(['Item 1', 'Item 2']);
    expect(createPayload.instructions).toEqual([]);
  });

  it('should bypass submission if form is invalid', () => {
    fixture.detectChanges();
    // title and slug are empty, form invalid
    component.onSubmit();
    expect(createPayload).toBeNull();
    expect(navigated).toEqual([]);
  });
});
