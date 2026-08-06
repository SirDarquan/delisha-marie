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
    // Reset httpMock to prevent cross-test pollution
    httpMock = undefined as unknown as HttpTestingController;
  });

  afterEach(() => {
    if (httpMock) {
      // Flush any pending metadata requests to prevent verify() from failing
      const methodsReqs = httpMock.match('/api/methods');
      methodsReqs.forEach((r) => !r.cancelled && r.flush([]));

      const holidaysReqs = httpMock.match('/api/holidays');
      holidaysReqs.forEach((r) => !r.cancelled && r.flush([]));

      const dietsReqs = httpMock.match('/api/special-diets');
      dietsReqs.forEach((r) => !r.cancelled && r.flush([]));

      const catsReqs = httpMock.match('/api/categories');
      catsReqs.forEach((r) => !r.cancelled && r.flush([]));

      httpMock.verify();
    }
  });

  describe('fetchRecipes', () => {
    it('should fetch recipes from api', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.fetchRecipes();
      const req = httpMock.expectOne('/api/recipes');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);

      const result = await promise;
      expect(result).toEqual(mockRecipes);
    });

    it('should append query parameters if provided', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.fetchRecipes(10, 20, 'pasta');
      const req = httpMock.expectOne('/api/recipes?offset=10&limit=20&search=pasta');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);

      const result = await promise;
      expect(result).toEqual(mockRecipes);
    });
  });

  describe('fetchRecipeById', () => {
    it('should fetch single recipe from api', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.fetchRecipeById(1);
      const req = httpMock.expectOne('/api/recipes/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes[0]);

      const result = await promise;
      expect(result).toEqual(mockRecipes[0]);
    });
  });

  describe('checkSlugAvailability', () => {
    it('should return true if slug is taken', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.checkSlugAvailability('taken-slug');
      const req = httpMock.expectOne('/api/check-slug?slug=taken-slug');
      expect(req.request.method).toBe('GET');
      req.flush({ taken: true });

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should return false if API returns false', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.checkSlugAvailability('free-slug');
      const req = httpMock.expectOne('/api/check-slug?slug=free-slug');
      expect(req.request.method).toBe('GET');
      req.flush({ taken: false });

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.checkSlugAvailability('error-slug');
      const req = httpMock.expectOne('/api/check-slug?slug=error-slug');
      expect(req.request.method).toBe('GET');
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('createRecipe', () => {
    it('should make POST request with generated UUID', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

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

      const promise = service.createRecipe(newRecipe);
      const req = httpMock.expectOne('/api/recipes');
      expect(req.request.method).toBe('POST');
      expect(typeof req.request.body.id).toBe('string');
      expect(req.request.body.title).toBe('Salad');

      const returnedRecipe = { ...newRecipe, id: req.request.body.id };
      req.flush(returnedRecipe);

      const result = await promise;
      expect(result).toEqual(returnedRecipe);
    });
  });

  describe('updateRecipe', () => {
    it('should make PUT request omitting id from payload', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.updateRecipe(1, { title: 'Updated Pasta' });
      const req = httpMock.expectOne('/api/recipes/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Updated Pasta' });

      const returnedRecipe = { ...mockRecipes[0], title: 'Updated Pasta' };
      req.flush(returnedRecipe);

      const result = await promise;
      expect(result).toEqual(returnedRecipe);
    });
  });

  describe('deleteRecipe', () => {
    it('should make DELETE request', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.deleteRecipe(2);
      const req = httpMock.expectOne('/api/recipes/2');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });

      const result = await promise;
      expect(result).toEqual({ success: true });
    });
  });

  describe('upload', () => {
    it('should successfully upload an image and return the file url', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const fakeFile = new File([''], 'test.png', { type: 'image/png' });
      const promise = service.upload(fakeFile);

      const req = httpMock.expectOne('/api/upload');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect(req.request.body.has('image')).toBe(true);

      req.flush({ success: true, files: ['/images/test.webp'] });

      const result = await promise;
      expect(result).toBe('/images/test.webp');
    });

    it('should return empty string if upload returns success true but no files', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const promise = service.upload(new File([''], 't.png'));
      const req = httpMock.expectOne('/api/upload');
      req.flush({ success: true, files: [] });

      expect(await promise).toBe('');
    });

    it('should return empty string on API error', async () => {
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const promise = service.upload(new File([''], 't.png'));
      const req = httpMock.expectOne('/api/upload');
      req.error(new ProgressEvent('Network error'));

      expect(await promise).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('State Restoration and Cache', () => {
    it('should store and retrieve scroll offset', () => {
      service = TestBed.inject(RecipeService);
      service.setLastScrollOffset(123);
      expect(service.getLastScrollOffset()).toBe(123);
    });

    it('should store and retrieve active recipe id', () => {
      service = TestBed.inject(RecipeService);
      service.setLastActiveRecipeId('rec123');
      expect(service.getLastActiveRecipeId()).toBe('rec123');
    });

    it('should store and retrieve cached recipes list', () => {
      service = TestBed.inject(RecipeService);
      service.setCachedRecipesList(mockRecipes);
      expect(service.getCachedRecipesList()).toEqual(mockRecipes);
    });
  });

  describe('Metadata Loading', () => {
    beforeEach(() => {
      // Clean up requests from constructor
      service = TestBed.inject(RecipeService);
      httpMock = TestBed.inject(HttpTestingController);

      const reqMethods = httpMock.expectOne('/api/methods');
      reqMethods.flush([]);
      const reqHolidays = httpMock.expectOne('/api/holidays');
      reqHolidays.flush([]);
      const reqDiets = httpMock.expectOne('/api/special-diets');
      reqDiets.flush([]);
    });

    it('should load methods correctly from API', async () => {
      const mockMethods = [{ id: '1', name: 'Air Frying', slug: 'air-frying' }];
      service['loadInitialMethods']();
      const req = httpMock.expectOne('/api/methods');
      req.flush(mockMethods);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.methods()).toEqual(mockMethods);
    });

    it.each([
      { method: 'loadInitialMethods', url: '/api/methods' },
      { method: 'loadInitialHolidays', url: '/api/holidays' },
      { method: 'loadInitialSpecialDiets', url: '/api/special-diets' },
    ])('should handle API errors gracefully in $method', async ({ method, url }) => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      (service as any)[method]();
      const req = httpMock.expectOne(url);
      req.error(new ProgressEvent('Error'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not set methods if API returns null or non-array', async () => {
      service['loadInitialMethods']();
      const req = httpMock.expectOne('/api/methods');
      req.flush(null);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.methods()).toEqual([]);
    });

    it('should load holidays correctly from API', async () => {
      const mockHolidays = [{ id: '1', name: 'Christmas' }];
      service['loadInitialHolidays']();
      const req = httpMock.expectOne('/api/holidays');
      req.flush(mockHolidays);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.holidays()).toEqual(mockHolidays);
    });



    it('should not set holidays if API returns null or non-array', async () => {
      service['loadInitialHolidays']();
      const req = httpMock.expectOne('/api/holidays');
      req.flush(null);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.holidays()).toEqual([]);
    });

    it('should load special diets correctly from API', async () => {
      const mockDiets = [{ id: '1', name: 'Vegan' }];
      service['loadInitialSpecialDiets']();
      const req = httpMock.expectOne('/api/special-diets');
      req.flush(mockDiets);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.specialDiets()).toEqual(mockDiets);
    });



    it('should not set special diets if API returns null or non-array', async () => {
      service['loadInitialSpecialDiets']();
      const req = httpMock.expectOne('/api/special-diets');
      req.flush(null);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.specialDiets()).toEqual([]);
    });
  });

  describe('Categories Initialization', () => {
    it('should not update categories if data is null', async () => {
      httpMock = TestBed.inject(HttpTestingController);
      service = TestBed.inject(RecipeService);

      // Before loading, the categories should be empty
      const initialCount = service.categories().length;

      // The constructor already called loadInitialCategories()
      // Mock the get call to return null
      const reqs = httpMock.match('/api/categories');
      reqs.forEach((req) => {
        if (!req.cancelled) {
          req.flush(null);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not have updated
      expect(service.categories().length).toBe(initialCount);
    });
  });
});
