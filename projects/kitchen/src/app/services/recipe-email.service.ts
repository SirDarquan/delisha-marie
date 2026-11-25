import { inject, Service } from '@angular/core';
import type { SendRecipeEventDetail } from '../utils/mount-email-recipe';
import { Api } from './api';

export interface SendRecipePayload {
  email: string;
  recipeSlug?: string;
  recipeTitle?: string;
  recipeUrl?: string;
  recipeImage?: string;
  recipeDescription?: string;
  subscribeNewsletter?: boolean;
}

export interface SendRecipeResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

@Service()
export class RecipeEmailService {
  private readonly api = inject(Api);

  async sendRecipe(payload: SendRecipePayload): Promise<SendRecipeResponse> {
    return this.api.post<SendRecipeResponse>('/send-recipe', payload);
  }

  async handleSendRecipeEvent(event: CustomEvent<SendRecipeEventDetail>): Promise<void> {
    const { resolve, reject, ...payload } = event.detail;
    try {
      await this.sendRecipe(payload);
      resolve?.();
    } catch (err) {
      reject?.(err);
    }
  }
}
