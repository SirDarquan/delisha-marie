import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecipeService } from './recipe.service';
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
});
