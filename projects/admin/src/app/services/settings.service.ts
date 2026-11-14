import { inject, Service } from '@angular/core';
import { ApiService } from './api.service';

export interface KitchenHomeSettings {
  featuredRecipes: string[];
  kitchen_about: string;
  sidebar_about: string;
}

@Service()
export class SettingsService {
  private readonly api = inject(ApiService);

  async getKitchenHomeSettings(): Promise<KitchenHomeSettings> {
    return this.api.get<KitchenHomeSettings>('/settings/kitchen-home');
  }
}
