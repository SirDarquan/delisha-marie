import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecipeIndexService } from './recipe-index.service';
import { RecipeIndexResponse } from '../../models/category';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RecipeIndexService', () => {
  let service: RecipeIndexService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeIndexService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecipeIndexService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch the full recipe index data correctly', async () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [{ name: 'Appetizers', image: '/img.png', url: '/app' }],
      cookingMethods: [{ name: 'Air Fryer', image: '/img.png', url: '/air' }],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      categoriesList: [],
      methodsList: [],
      ingredients: [],
    };

    const promise = service.getData();

    const req = httpMock.expectOne('/api/recipe-index');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const data = await promise;
    expect(data).toEqual(mockResponse);
    expect(data.featuredCategories.length).toBe(1);
    expect(data.cookingMethods.length).toBe(1);
  });

  it('should handle empty response properties', async () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [],
      cookingMethods: [],
      holidays: [],
      specialDiets: [],
      bestRecipes: [],
      categoriesList: [],
      methodsList: [],
      ingredients: [],
    };

    const promise = service.getData();

    const req = httpMock.expectOne('/api/recipe-index');
    req.flush(mockResponse);

    const data = await promise;
    expect(data.featuredCategories.length).toBe(0);
    expect(data.cookingMethods.length).toBe(0);
  });
});
