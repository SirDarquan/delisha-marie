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

  it('should be created', () => {
    const req = httpMock.expectOne('/api/recipes');
    req.flush([]);
    expect(service).toBeTruthy();
  });

  it('should fetch recipes', () => {
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

    // Subscribing to recipes() signal since toSignal(httpClient.get) is used
    // Actually, recipes() is a signal, so we just check its value after the request
    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush(mockRecipes);

    expect(service.recipes()).toEqual(mockRecipes);
  });
});
