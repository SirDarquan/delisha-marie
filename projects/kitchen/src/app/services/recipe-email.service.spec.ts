import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Api } from './api';
import { RecipeEmailService } from './recipe-email.service';

describe('RecipeEmailService', () => {
  let service: RecipeEmailService;
  let api: Api;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeEmailService,
        {
          provide: Api,
          useValue: {
            post: vi.fn().mockResolvedValue({ success: true, message: 'It submitted!' }),
          },
        },
      ],
    });

    service = TestBed.inject(RecipeEmailService);
    api = TestBed.inject(Api);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call api.post with /send-recipe and payload', async () => {
    const payload = {
      email: 'test@example.com',
      recipeSlug: 'garlic-salmon',
    };
    await service.sendRecipe(payload);
    expect(api.post).toHaveBeenCalledWith('/send-recipe', payload);
  });

  it('should handle custom event and resolve on success', async () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const event = new CustomEvent('sendRecipe', {
      detail: {
        email: 'test@example.com',
        recipeSlug: 'garlic-salmon',
        resolve,
        reject,
      },
    });

    await service.handleSendRecipeEvent(event);

    expect(api.post).toHaveBeenCalledWith('/send-recipe', {
      email: 'test@example.com',
      recipeSlug: 'garlic-salmon',
    });
    expect(resolve).toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
  });

  it('should handle custom event and reject on failure', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Network error'));
    const resolve = vi.fn();
    const reject = vi.fn();
    const event = new CustomEvent('sendRecipe', {
      detail: {
        email: 'test@example.com',
        resolve,
        reject,
      },
    });

    await service.handleSendRecipeEvent(event);

    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledWith(expect.any(Error));
  });
});
