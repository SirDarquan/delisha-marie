import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecipeIndexService } from './recipe-index.service';
import { RecipeIndexResponse } from '../models/category';
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

  it('should fetch the full recipe index data correctly', () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [{ name: 'Appetizers', image: '/app.png', url: '/recipes/appetizers' }],
      cookingMethods: [{ name: 'Baked', image: '/baked.png', url: '/methods/baked' }],
    };

    service.getData().subscribe((data) => {
      expect(data).toEqual(mockResponse);
      expect(data.featuredCategories.length).toBe(1);
      expect(data.cookingMethods.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/recipe-index');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle empty response properties', () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [],
      cookingMethods: [],
    };

    service.getData().subscribe((data) => {
      expect(data.featuredCategories.length).toBe(0);
      expect(data.cookingMethods.length).toBe(0);
    });

    const req = httpMock.expectOne('/api/recipe-index');
    req.flush(mockResponse);
  });
});
