import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetSupabaseClient } from './supabase';

const { mockCheckBotId, mockSupabase } = vi.hoisted(() => ({
  mockCheckBotId: vi.fn().mockResolvedValue({ isBot: false }),
  mockSupabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('botid/server', () => ({
  checkBotId: (...args: unknown[]) => {
    const fn = (globalThis as unknown as { __sharedCheckBotId?: (...a: unknown[]) => unknown })
      .__sharedCheckBotId;
    return fn ? fn(...args) : mockCheckBotId(...args);
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

import sendRecipeHandler, { resolveRecipeImageUrl } from './send-recipe';

describe('POST /send-recipe', () => {
  beforeEach(() => {
    process.env['SENDER_API_TOKEN'] = 'fake_token';
    process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
    process.env['SITE_URL'] = 'https://delishamarie.com';
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_KEY'] = 'fake_supabase_key';
    resetSupabaseClient();
    vi.restoreAllMocks();
    (globalThis as unknown as { __sharedCheckBotId: typeof mockCheckBotId }).__sharedCheckBotId =
      mockCheckBotId;
    mockCheckBotId.mockResolvedValue({ isBot: false });
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('returns 404 for non-POST methods', async () => {
    const req = { method: 'GET' } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('returns 400 if email is missing or invalid', async () => {
    const req = {
      method: 'POST',
      body: { recipeSlug: 'chocolate-cake' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Valid email is required' });
  });

  it('returns 200 mock success if bot is detected', async () => {
    mockCheckBotId.mockResolvedValue({ isBot: true });

    const req = {
      method: 'POST',
      body: { email: 'bot@example.com', recipeSlug: 'test' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'It submitted!' });
  });

  it('returns 500 if SENDER token is missing', async () => {
    vi.stubEnv('SENDER_API_TOKEN', '');

    const req = {
      method: 'POST',
      body: { email: 'user@example.com', recipeSlug: 'test' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
  });

  it('formats recipe url with /kitchen/recipe/:slug and resolves image with OPTIMIZE_IMAGE', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, emailId: 'msg_9876' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'POST',
      headers: { host: 'delishamarie.com', 'x-forwarded-proto': 'https' },
      body: {
        email: 'baker@example.com',
        recipeSlug: 'creamy-garlic-tuscan-butter-salmon',
        recipeTitle: 'Creamy Garlic Tuscan Butter Salmon',
        recipeImage: '/2026/08/creamy-garlic-tuscan-butter-salom.webp',
        recipeDescription: 'Pan-seared salmon smothered in rich creamy garlic sauce.',
        subscribeNewsletter: true,
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'It submitted!',
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sender.net/v2/message/b2gyKJ/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake_token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          to: {
            email: 'baker@example.com',
            name: 'baker',
          },
          variables: {
            url: 'https://delishamarie.com/kitchen/recipe/creamy-garlic-tuscan-butter-salmon',
            title: 'Creamy Garlic Tuscan Butter Salmon',
            description: 'Pan-seared salmon smothered in rich creamy garlic sauce.',
            image:
              'https://ik.imagekit.io/delishamarie/2026/08/creamy-garlic-tuscan-butter-salom.webp',
          },
        }),
      }),
    );
  });

  it('resolves absolute image url untouched', () => {
    const absolute = 'https://example.com/salmon.jpg';
    expect(resolveRecipeImageUrl(absolute)).toBe(absolute);
  });

  it('resolves relative recipeImage with OPTIMIZE_IMAGE when configured', () => {
    vi.stubEnv('OPTIMIZE_IMAGE', 'https://ik.imagekit.io/delishamarie');
    const resolved = resolveRecipeImageUrl('/2026/08/creamy-garlic-tuscan-butter-salom.webp');
    expect(resolved).toBe(
      'https://ik.imagekit.io/delishamarie/2026/08/creamy-garlic-tuscan-butter-salom.webp',
    );
  });

  it('fetches recipe from Supabase when only slug is provided and sets kitchen URL and image', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: {
        title: 'Creamy Garlic Tuscan Butter Salmon',
        slug: 'creamy-garlic-tuscan-butter-salmon',
        image: '/2026/08/creamy-garlic-tuscan-butter-salom.webp',
        description: 'Crispy loaf',
      },
      error: null,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'POST',
      headers: { host: 'delishamarie.com', 'x-forwarded-proto': 'https' },
      body: {
        email: 'cook@example.com',
        recipeSlug: 'creamy-garlic-tuscan-butter-salmon',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'creamy-garlic-tuscan-butter-salmon');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sender.net/v2/message/b2gyKJ/send',
      expect.objectContaining({
        body: JSON.stringify({
          to: {
            email: 'cook@example.com',
            name: 'cook',
          },
          variables: {
            url: 'https://delishamarie.com/kitchen/recipe/creamy-garlic-tuscan-butter-salmon',
            title: 'Creamy Garlic Tuscan Butter Salmon',
            description: 'Crispy loaf',
            image:
              'https://ik.imagekit.io/delishamarie/2026/08/creamy-garlic-tuscan-butter-salom.webp',
          },
        }),
      }),
    );
  });

  it('handles Sender API error response properly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Unprocessable Entity: Invalid recipient',
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'POST',
      body: {
        email: 'invalid@example.com',
        recipeTitle: 'Error Recipe',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to send recipe email',
      }),
    );
  });

  it('handles unexpected exceptions and returns 500', async () => {
    mockCheckBotId.mockRejectedValue(new Error('Bot service unreachable'));

    const req = {
      method: 'POST',
      body: { email: 'test@example.com' },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('handles Supabase query errors gracefully without failing the email dispatch', async () => {
    mockSupabase.maybeSingle.mockRejectedValue(new Error('Database unavailable'));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: {
        email: 'chef@example.com',
        recipeSlug: 'garlic-salmon',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles custom recipeUrl with http, relative path, and path with /kitchen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    global.fetch = fetchMock;

    const req1 = {
      method: 'POST',
      body: {
        email: 'chef@example.com',
        recipeUrl: 'https://other-site.com/recipes/salmon',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res1 = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(200);

    const req2 = {
      method: 'POST',
      body: {
        email: 'chef@example.com',
        recipeUrl: 'salmon-dish',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res2 = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(200);

    const req3 = {
      method: 'POST',
      body: {
        email: 'chef@example.com',
        recipeUrl: '/kitchen/salmon-dish',
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res3 = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req3, res3);
    expect(res3.status).toHaveBeenCalledWith(200);
  });

  it('handles newsletter subscription rejection gracefully', async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ success: true }),
        });
      }
      return Promise.reject(new Error('Newsletter service timeout'));
    });
    global.fetch = fetchMock;

    const req = {
      method: 'POST',
      body: {
        email: 'chef@example.com',
        recipeSlug: 'garlic-salmon',
        subscribeNewsletter: true,
      },
    } as unknown as import('@vercel/node').VercelRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as import('@vercel/node').VercelResponse;

    await sendRecipeHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles resolveRecipeImageUrl edge cases', () => {
    delete process.env['OPTIMIZE_IMAGE'];
    expect(resolveRecipeImageUrl('recipes/image.jpg')).toBe('recipes/image.jpg');
    expect(resolveRecipeImageUrl('/recipes/image.jpg')).toBe('/recipes/image.jpg');

    process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie/';
    expect(resolveRecipeImageUrl('/recipes/image.jpg')).toBe(
      'https://ik.imagekit.io/delishamarie/recipes/image.jpg',
    );
    expect(resolveRecipeImageUrl('recipes/image.jpg')).toBe(
      'https://ik.imagekit.io/delishamarie/recipes/image.jpg',
    );
    process.env['OPTIMIZE_IMAGE'] = 'https://ik.imagekit.io/delishamarie';
    process.env['SUPABASE_KEY'] = 'test-key';
  });
});
