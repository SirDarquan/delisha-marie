import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';
import { Api } from '../../services/api';
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('SearchService', () => {
  let service: SearchService;
  let mockApi: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockApi = {
      post: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    };

    TestBed.configureTestingModule({
      providers: [SearchService, { provide: Api, useValue: mockApi }],
    });
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty result if query is empty', async () => {
    const result = await service.searchRecipes('', 1, 12);
    expect(result).toEqual({ items: [], total: 0 });
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('should call api.post with correct payload if query is provided', async () => {
    mockApi.post.mockResolvedValue({
      items: [{ id: '1', title: 'Test' }],
      total: 1,
    });

    const result = await service.searchRecipes('chicken', 2, 10);
    expect(mockApi.post).toHaveBeenCalledWith('/search', {
      query: 'chicken',
      page: 2,
      pageSize: 10,
    });
    expect(result).toEqual({
      items: [{ id: '1', title: 'Test' }],
      total: 1,
    });
  });
});
