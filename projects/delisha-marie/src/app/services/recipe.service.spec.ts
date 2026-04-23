import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecipeService, Recipe } from './recipe.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RecipeService', () => {
  let service: RecipeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [RecipeService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
    // Read the signal to trigger the resource loader
    service.recipes();
    TestBed.flushEffects();
    const req = httpMock.expectOne('/api/recipes');
    req.flush([]);
  });

  it('should fetch recipes', async () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Test Recipe',
        image: 'test.png',
        description: 'Test',
        prepTime: '10m',
        category: 'Testing',
        rating: 5,
        difficulty: 'Easy',
      },
    ];

    // Trigger loader
    service.recipes();
    TestBed.flushEffects();

    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush(mockRecipes);

    // Wait for the Promise from the mock response to resolve and update the resource
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.recipes()).toEqual(mockRecipes);
  });

  it('should fetch paginated recipes via getRecipes', async () => {
    const mockAllRecipes = [
      { id: 1, title: 'R1' } as unknown as Recipe,
      { id: 2, title: 'R2' } as unknown as Recipe,
      { id: 3, title: 'R3' } as unknown as Recipe,
    ];

    const promise = service.getRecipes(2, 2, 'baking', 'cakes', 'chocolate');

    const req = httpMock.expectOne(
      '/api/recipes?page=2&pageSize=2&method=baking&category=cakes&subcategory=chocolate',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAllRecipes);

    const result = await promise;
    expect(result.total).toBe(3);
    // Since page=2, pageSize=2, start=2. Slice from 2 to 4 -> [R3]
    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(3);
  });
});
