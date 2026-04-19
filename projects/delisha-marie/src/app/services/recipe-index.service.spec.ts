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

  it('should fetch categories and map them correctly', () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [
        { name: 'Appetizers', image: '/app.png', url: '/recipes/appetizers' },
        { name: 'Desserts', image: '/dess.png', url: '/recipes/desserts' },
      ],
    };

    service.getFeaturedCategories().subscribe((categories) => {
      expect(categories.length).toBe(2);
      expect(categories[0].name).toBe('Appetizers');
      expect(categories).toEqual(mockResponse.featuredCategories);
    });

    const req = httpMock.expectOne('/api/recipe-index');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle empty categories response', () => {
    const mockResponse: RecipeIndexResponse = {
      featuredCategories: [],
    };

    service.getFeaturedCategories().subscribe((categories) => {
      expect(categories.length).toBe(0);
    });

    const req = httpMock.expectOne('/api/recipe-index');
    req.flush(mockResponse);
  });
});
