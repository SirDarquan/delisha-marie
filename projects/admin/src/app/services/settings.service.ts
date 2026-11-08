import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly api = inject(ApiService);

  async getKitchenHomeSettings(): Promise<KitchenHomeSettings> {
    return this.api.get<KitchenHomeSettings>('/settings/kitchen-home');
  }

  async saveKitchenHomeSettings(settings: KitchenHomeSettings): Promise<KitchenHomeSettings> {
    return this.api.put<KitchenHomeSettings>('/settings/kitchen-home', settings);
  }
}
