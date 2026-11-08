import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsService, KitchenHomeSettings } from './settings.service';
import { ApiService } from './api.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let apiSpy: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { get: vi.fn(), put: vi.fn() };
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

  it('should save kitchen home settings', async () => {
    const mockSettings: KitchenHomeSettings = {
      featuredRecipes: ['/recipes/a', '/recipes/b', '/recipes/c'],
      kitchen_about: 'img1.png',
      sidebar_about: 'img2.png',
    };
    apiSpy.put.mockResolvedValue(mockSettings);

    const result = await service.saveKitchenHomeSettings(mockSettings);
    expect(apiSpy.put).toHaveBeenCalledWith('/settings/kitchen-home', mockSettings);
    expect(result).toEqual(mockSettings);
  });

  it('should throw if getKitchenHomeSettings fails', async () => {
    apiSpy.get.mockRejectedValue(new Error('fetch failed'));
    await expect(service.getKitchenHomeSettings()).rejects.toThrow('fetch failed');
  });

  it('should throw if saveKitchenHomeSettings fails', async () => {
    const mockSettings: KitchenHomeSettings = {
      featuredRecipes: [],
      kitchen_about: '',
      sidebar_about: '',
    };
    apiSpy.put.mockRejectedValue(new Error('save failed'));
    await expect(service.saveKitchenHomeSettings(mockSettings)).rejects.toThrow('save failed');
  });
});
