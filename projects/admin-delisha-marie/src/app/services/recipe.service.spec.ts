import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Recipe } from '../models/recipe.model';
import { RecipeService } from './recipe.service';

if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    clear: () => {
      for (const key in store) {
        delete store[key];
      }
    },
    getItem: (key: string) => store[key] || null,
    key: (index: number) => Object.keys(store)[index] || null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    get length() {
      return Object.keys(store).length;
    },
  } as unknown as Storage;
}

describe('RecipeService', () => {
  let service: RecipeService;
  let httpMock: HttpTestingController;

  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Pasta',
      slug: 'pasta',
      description: 'Test pasta',
      content: 'Sample content',
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
    {
      id: 2,
      title: 'Tacos',
      slug: 'tacos',
      description: 'Test tacos',
      content: 'Sample content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Intermediate',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'draft',
    },
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RecipeService],
    });
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should load initial recipes correctly from api if storage is empty', async () => {
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('/api/recipes');
    req.flush(mockRecipes);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.recipes()).toEqual(mockRecipes);
    expect(service.getRecipes()).toEqual(mockRecipes);
  });

  it('should handle API errors gracefully in loadInitialRecipes', async () => {
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('/api/recipes');
    req.error(new ProgressEvent('Network Error'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.recipes()).toEqual([]);
  });

  it('should load from localStorage if present', () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }

    service = TestBed.inject(RecipeService);
    expect(service.recipes()).toEqual(mockRecipes);
  });

  it('should fallback to api if stored string is malformed', async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', 'not valid json');
    }

    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('/api/recipes');
    req.flush(mockRecipes);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.recipes()).toEqual(mockRecipes);
  });

  it('should find recipe by id or slug correctly, including stripping recipe prefix', () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }
    service = TestBed.inject(RecipeService);

    expect(service.getRecipeByIdOrSlug('1')).toBeTruthy();
    expect(service.getRecipeByIdOrSlug('pasta')).toBeTruthy();
    expect(service.getRecipeByIdOrSlug('recipe/pasta')).toBeTruthy();
    expect(service.getRecipeByIdOrSlug('/recipe/pasta')).toBeTruthy();
    expect(service.getRecipeByIdOrSlug('nonexistent')).toBeNull();
  });

  it('should create a new recipe with generated UUID', async () => {
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    // Swallow constructor fetch
    const initReq = httpMock.expectOne('/api/recipes');
    initReq.flush(mockRecipes);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const newRecipe: Omit<Recipe, 'id'> = {
      title: 'Salad',
      slug: 'salad',
      description: 'Test salad',
      content: 'Sample salad content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'draft',
    };

    const created = service.createRecipe(newRecipe);
    expect(typeof created.id).toBe('string');
    expect(created.id).toBeTruthy();
    expect(service.recipes().length).toBe(3);

    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });

  it('should log an error to console when createRecipe backend call fails', async () => {
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/recipes').flush([]);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.createRecipe({
      title: 'Fail',
      slug: 'fail',
      description: '',
      content: '',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Chef',
      status: 'draft',
    });

    const req = httpMock.expectOne('/api/recipes');
    req.error(new ProgressEvent('Network Error'));

    await new Promise((resolve) => setTimeout(resolve, 0)); // Let microtask flush
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle creating recipe when original list is empty', () => {
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
    const initReq = httpMock.expectOne('/api/recipes');
    initReq.flush([]);

    expect(service.recipes().length).toBe(0);

    const created = service.createRecipe({
      title: 'Salad',
      slug: 'salad',
      description: 'Test salad',
      content: 'Sample salad content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'draft',
    });
    expect(typeof created.id).toBe('string');
    expect(created.id).toBeTruthy();
    expect(service.recipes().length).toBe(1);

    const req = httpMock.expectOne('/api/recipes');
    req.flush(created);
  });

  it('should update an existing recipe by ID', () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    const updated = service.updateRecipe(1, { title: 'Updated Pasta' });
    expect(updated).toBeTruthy();
    expect(updated?.title).toBe('Updated Pasta');
    expect(service.recipes()[0].title).toBe('Updated Pasta');

    const req = httpMock.expectOne('/api/recipes/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updated);

    // nonresident shouldn't trigger request
    expect(service.updateRecipe(999, { title: 'Nope' })).toBeNull();
  });

  it('should log an error to console when updateRecipe backend call fails', async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.updateRecipe(1, { title: 'Failed Update' });
    const req = httpMock.expectOne('/api/recipes/1');
    req.error(new ProgressEvent('Network Error'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should delete an existing recipe by ID', () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    const deleted = service.deleteRecipe(2);
    expect(deleted).toBe(true);
    expect(service.recipes().length).toBe(1);

    const req = httpMock.expectOne('/api/recipes/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    // non existent shouldn't trigger request
    expect(service.deleteRecipe(999)).toBe(false);
  });

  it('should log an error to console when deleteRecipe backend call fails', async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_recipes', JSON.stringify(mockRecipes));
    }
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.deleteRecipe(1);
    const req = httpMock.expectOne('/api/recipes/1');
    req.error(new ProgressEvent('Network Error'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should skip storage loads and saves if window is undefined', async () => {
    vi.stubGlobal('window', undefined);
    httpMock = TestBed.inject(HttpTestingController);

    try {
      const localService = TestBed.inject(RecipeService);
      expect(localService).toBeTruthy();
      localService['saveToStorage']([]);
      const req = httpMock.expectOne('/api/recipes');
      req.flush([]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
