import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsService, KitchenHomeSettings } from './settings.service';
import { ApiService } from './api.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let apiSpy: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [SettingsService, { provide: ApiService, useValue: apiSpy }],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch kitchen home settings', async () => {
    const mockSettings: KitchenHomeSettings = {
      featuredRecipes: ['/recipes/1', '/recipes/2', '/recipes/3'],
      kitchen_about: 'delisha_marie_profile_2.png',
      sidebar_about: 'delisha_marie_profile.png',
    };
    apiSpy.get.mockResolvedValue(mockSettings);

    const result = await service.getKitchenHomeSettings();
    expect(apiSpy.get).toHaveBeenCalledWith('/settings/kitchen-home');
    expect(result).toEqual(mockSettings);
  });

  it('should throw if getKitchenHomeSettings fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('fetch failed'));
    await expect(service.getKitchenHomeSettings()).rejects.toThrow('fetch failed');
  });
});
