import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest } from '@vercel/node';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { createRequestMock } from './test-utils';
import llmsHandler, {
  getBaseUrl,
  getHomeUrl,
  hasKitchenPrefix,
  htmlToMarkdown,
  normalizeIngredients,
  normalizeInstructions,
  formatFullRecipe,
  generateLlmsTxt,
  generateLlmsFullTxt,
} from './llms';
import { resetSupabaseClient } from './supabase';

describe('llms endpoint', () => {
  let request: ReturnType<typeof createRequestMock>;
  const originalEnv = process.env;

  const mockRecipesData = [
    {
      id: '1',
      title: 'Classic Chocolate Cake',
      slug: 'classic-chocolate-cake',
      description: 'Rich and moist chocolate layer cake with fudge frosting.',
      content: 'Bake at 350 degrees.',
      prep_time: '20 mins',
      cook_time: '35 mins',
      total_time: '55 mins',
      yield: '8 servings',
      cuisine: 'American',
      course: 'Dessert',
      method: 'Baking',
      ingredients: [
        { amount: '2', unit: 'cups', name: 'all-purpose flour' },
        { amount: '3/4', unit: 'cup', name: 'cocoa powder' },
        '2 cups granulated sugar',
      ],
      instructions: [
        { text: 'Whisk together dry ingredients.' },
        'Add eggs and buttermilk.',
        { step: 'Bake for 35 minutes.' },
      ],
      notes: 'Cool completely before frosting.',
      updated_at: '2026-09-01T12:00:00.000Z',
      created_at: '2026-08-01T12:00:00.000Z',
    },
    {
      id: '2',
      title: 'Simple Pancake Stack',
      slug: 'simple-pancakes',
      description: null,
      ingredients: '1 cup flour\n1 cup milk\n1 egg',
      instructions: 'Whisk batter\nCook on griddle',
      created_at: '2026-08-02T12:00:00.000Z',
    },
  ];

  const mockPagesData = [
    {
      title: 'About Delisha Marie',
      slug: 'about',
      description: '<p>Learn about our <strong>passion</strong> for cooking and baking.</p>',
      content:
        '<p>Delisha Marie was created out of a lifelong love for comforting food.</p><p>Visit our <a href="https://example.com/story">story</a>.</p>',
    },
    {
      title: 'FAQ',
      slug: 'faq',
      description: 'Common questions and measurement conversion guides.',
      content:
        '<div class="prose"><p>Here are the most frequently asked baking questions.</p><ul><li>Always use room temperature eggs</li></ul></div>',
    },
    {
      title: 'Baking Guide',
      slug: 'baking-guide',
      description: 'Essential techniques for everyday bakers.',
      content: 'Always weigh your flour for consistent results.',
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      description: 'Privacy guidelines',
      content: 'We respect your privacy.',
    },
    {
      title: 'Blank Page',
      slug: 'blank-page',
      description: null,
      content: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env['SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['SUPABASE_KEY'] = 'test-key';
    delete process.env['SITE_URL'];
    resetSupabaseClient();

    request = createRequestMock(llmsHandler);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'recipes') {
        const chain: Record<string, unknown> = {
          select: vi.fn((_cols, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === 'exact') {
              return chain;
            }
            return chain;
          }),
          eq: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => Promise.resolve({ data: mockRecipesData, error: null })),
          then: (resolve: (val: unknown) => void) =>
            resolve({ data: mockRecipesData, count: 1, error: null }),
        };
        return chain;
      }
      if (table === 'recipe_holidays' || table === 'recipe_special_diets') {
        const chain: Record<string, unknown> = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          then: (resolve: (val: unknown) => void) => resolve({ count: 1, error: null }),
        };
        return chain;
      }
      if (table === 'pages') {
        const chain: Record<string, unknown> = {
          select: vi.fn(() => chain),
          order: vi.fn(() => Promise.resolve({ data: mockPagesData, error: null })),
        };
        return chain;
      }
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSupabaseClient();
  });

  describe('GET /llms.txt', () => {
    it('should return concise llms.txt markdown with links and headers', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/llms.txt');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.headers['cache-control']).toContain('public, max-age=3600');
      expect(res.text).toContain('# Delisha Marie');
      expect(res.text).toContain('> A premier modern cooking and baking blog');
      expect(res.text).toContain('## Main Pages');
      expect(res.text).toContain(
        '- [Home](https://delishamarie.com/): Welcome hub featuring latest recipes',
      );
      expect(res.text).toContain('- [About Delisha Marie](https://delishamarie.com/about)');
      expect(res.text).toContain('- [Baking Guide](https://delishamarie.com/baking-guide)');
      expect(res.text).toContain('## Published Recipes');
      expect(res.text).toContain(
        '- [Classic Chocolate Cake](https://delishamarie.com/recipe/classic-chocolate-cake): Rich and moist chocolate layer cake with fudge frosting.',
      );
      expect(res.text).toContain(
        '- [Simple Pancake Stack](https://delishamarie.com/recipe/simple-pancakes): Delicious recipe by Delisha Marie.',
      );
      expect(res.text).toContain('- [Full LLM Context](https://delishamarie.com/llms-full.txt)');
      expect(res.text).not.toContain('/search');
      expect(res.text).not.toContain('thank-you');
    });

    it('should support /kitchen prefix in urls via path query param', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/api/llms?path=/kitchen/llms.txt');

      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '- [Classic Chocolate Cake](https://delishamarie.com/kitchen/recipe/classic-chocolate-cake)',
      );
      expect(res.text).toContain(
        '- [Full LLM Context](https://delishamarie.com/kitchen/llms-full.txt)',
      );
    });

    it('should bend links with /kitchen when ROBOTS_TXT contains /kitchen even if requested at /llms.txt', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      process.env['ROBOTS_TXT'] = JSON.stringify({
        sitemap: ['/kitchen/sitemap-pages.xml'],
      });
      const res = await request().get('/llms.txt');

      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '- [Classic Chocolate Cake](https://delishamarie.com/kitchen/recipe/classic-chocolate-cake)',
      );
      expect(res.text).toContain(
        '- [Full LLM Context](https://delishamarie.com/kitchen/llms-full.txt)',
      );
    });

    it('should bend links with /kitchen in llms-full.txt when requested with /kitchen prefix', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/api/llms?full=true&path=/kitchen/llms-full.txt');

      expect(res.status).toBe(200);
      expect(res.text).toContain(
        '- **URL**: https://delishamarie.com/kitchen/recipe/classic-chocolate-cake',
      );
      expect(res.text).toContain('- **URL**: https://delishamarie.com/kitchen/faq');
    });

    it('should handle empty recipes and empty pages gracefully', async () => {
      mockFrom.mockImplementation(() => {
        const chain: Record<string, unknown> = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: (resolve: (val: unknown) => void) => resolve({ data: null, count: 0, error: null }),
        };
        return chain;
      });

      const res = await request().get('/llms.txt');
      expect(res.status).toBe(200);
      expect(res.text).toContain('# Delisha Marie');
      expect(res.text).not.toContain('## Recipe Categories & Methods');
      expect(res.text).not.toContain('## Published Recipes');
    });
  });

  describe('GET /llms-full.txt', () => {
    it('should return complete llms-full.txt with ingredients, instructions, and pages in correct order', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/llms-full.txt');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text).toContain('# Delisha Marie - Full Context');

      // Recipes must appear BEFORE Information Pages
      const recipesIndex = res.text.indexOf('## Recipes');
      const infoIndex = res.text.indexOf('## Information Pages');
      expect(recipesIndex).toBeGreaterThan(-1);
      expect(infoIndex).toBeGreaterThan(-1);
      expect(recipesIndex).toBeLessThan(infoIndex);

      expect(res.text).toContain('### Classic Chocolate Cake');
      expect(res.text).toContain(
        '- **URL**: https://delishamarie.com/recipe/classic-chocolate-cake',
      );
      expect(res.text).toContain('- **Prep Time**: 20 mins');
      expect(res.text).toContain('- **Cook Time**: 35 mins');
      expect(res.text).toContain('- **Servings**: 8 servings');
      expect(res.text).toContain('- **Cuisine**: American');
      expect(res.text).toContain('- **Course**: Dessert');
      expect(res.text).toContain('- **Method**: Baking');

      expect(res.text).toContain('#### Ingredients');
      expect(res.text).toContain('- 2 cups all-purpose flour');
      expect(res.text).toContain('- 3/4 cup cocoa powder');
      expect(res.text).toContain('- 2 cups granulated sugar');

      expect(res.text).toContain('#### Instructions');
      expect(res.text).toContain('1. Whisk together dry ingredients.');
      expect(res.text).toContain('2. Add eggs and buttermilk.');
      expect(res.text).toContain('3. Bake for 35 minutes.');

      expect(res.text).toContain('#### Notes\nCool completely before frosting.');

      expect(res.text).toContain('### Simple Pancake Stack');
      expect(res.text).toContain('- 1 cup flour');
      expect(res.text).toContain('1. Whisk batter');

      expect(res.text).toContain('### About Delisha Marie');
      expect(res.text).toContain(
        'Delisha Marie was created out of a lifelong love for comforting food.\n\nVisit our [story](https://example.com/story).',
      );
      expect(res.text).toContain('### Contact');
      expect(res.text).toContain('- **URL**: https://delishamarie.com/contact');
      expect(res.text).toContain('### FAQ & Kitchen Tips');
      expect(res.text).toContain(
        'Here are the most frequently asked baking questions.\n\n- Always use room temperature eggs',
      );
      expect(res.text).toContain('### Baking Guide');
      expect(res.text).toContain('Always weigh your flour for consistent results.');

      // Check no raw html remains
      expect(res.text).not.toContain('<p>');
      expect(res.text).not.toContain('</p>');
      expect(res.text).not.toContain('<div');
      expect(res.text).not.toContain('</div>');
      expect(res.text).not.toContain('<ul>');
      expect(res.text).not.toContain('<li>');
      expect(res.text).not.toContain('<a href');
    });

    it('should trigger full mode when ?full=true is in query', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/api/llms?full=true');

      expect(res.status).toBe(200);
      expect(res.text).toContain('# Delisha Marie - Full Context');
    });

    it('should trigger full mode when ?full=1 is in query', async () => {
      process.env['SITE_URL'] = 'https://delishamarie.com';
      const res = await request().get('/api/llms?full=1');

      expect(res.status).toBe(200);
      expect(res.text).toContain('# Delisha Marie - Full Context');
    });

    it('should handle null category counts in database safely', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'recipes') {
          const chain: Record<string, unknown> = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            lte: vi.fn(() => chain),
            order: vi.fn(() => Promise.resolve({ data: mockRecipesData, error: null })),
            then: (resolve: (val: unknown) => void) =>
              resolve({ data: mockRecipesData, count: null, error: null }),
          };
          return chain;
        }
        if (table === 'recipe_holidays' || table === 'recipe_special_diets') {
          const chain: Record<string, unknown> = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            lte: vi.fn(() => chain),
            then: (resolve: (val: unknown) => void) => resolve({ count: null, error: null }),
          };
          return chain;
        }
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      });

      const res = await request().get('/llms.txt');
      expect(res.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when Supabase query throws an error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await request().get('/llms.txt');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to generate LLM context');
      expect(res.body.details).toBe('Database connection failed');
    });

    it('should return 500 when Supabase query throws a non-Error exception', async () => {
      mockFrom.mockImplementation(() => {
        throw 'String database failure';
      });

      const res = await request().get('/llms.txt');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to generate LLM context');
      expect(res.body.details).toBe('String database failure');
    });
  });

  describe('Helper Functions & Edge Cases', () => {
    it('normalizeIngredients should handle various input types', () => {
      expect(normalizeIngredients(null)).toEqual([]);
      expect(normalizeIngredients(undefined)).toEqual([]);
      expect(normalizeIngredients('   ')).toEqual([]);
      expect(normalizeIngredients('salt\npepper\n')).toEqual(['salt', 'pepper']);

      const mixedArray = [
        '1 tsp salt',
        { amount: '1', unit: 'tbsp', name: 'butter' },
        { text: 'fresh rosemary' },
        { unknown: 123 },
        null,
        123,
      ];
      expect(normalizeIngredients(mixedArray)).toEqual([
        '1 tsp salt',
        '1 tbsp butter',
        'fresh rosemary',
      ]);
    });

    it('normalizeInstructions should handle various input types', () => {
      expect(normalizeInstructions(null)).toEqual([]);
      expect(normalizeInstructions(undefined)).toEqual([]);
      expect(normalizeInstructions('   ')).toEqual([]);
      expect(normalizeInstructions('step 1\nstep 2\n')).toEqual(['step 1', 'step 2']);

      const mixedArray = [
        'Preheat oven',
        { text: 'Mix ingredients' },
        { instruction: 'Pour into pan' },
        { step: 'Bake for 20 mins' },
        { unknown: 123 },
        null,
      ];
      expect(normalizeInstructions(mixedArray)).toEqual([
        'Preheat oven',
        'Mix ingredients',
        'Pour into pan',
        'Bake for 20 mins',
      ]);
    });

    it('getBaseUrl should respect different environment variables and headers', () => {
      // 1. SITE_URL with trailing slash
      process.env['SITE_URL'] = 'https://mysite.com/';
      expect(getBaseUrl({ headers: {} } as VercelRequest)).toBe('https://mysite.com');

      // 2. Preview env
      delete process.env['SITE_URL'];
      process.env['VERCEL_ENV'] = 'preview';
      process.env['VERCEL_URL'] = 'preview-branch.vercel.app';
      expect(getBaseUrl({ headers: {} } as VercelRequest)).toBe(
        'https://preview-branch.vercel.app',
      );

      // 3. Production env
      process.env['VERCEL_ENV'] = 'production';
      process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'prod-domain.com';
      expect(getBaseUrl({ headers: {} } as VercelRequest)).toBe('https://prod-domain.com');

      // 4. Custom headers
      delete process.env['VERCEL_ENV'];
      const req = {
        headers: {
          'x-forwarded-proto': 'http',
          host: 'custom-domain.local:3000',
        },
      } as unknown as VercelRequest;
      expect(getBaseUrl(req)).toBe('http://custom-domain.local:3000');

      // 5. Default localhost fallback
      expect(getBaseUrl({ headers: {} } as VercelRequest)).toBe('https://localhost');
    });

    it('generateLlmsFullTxt should provide defaults when about or faq pages are missing', () => {
      const fullText = generateLlmsFullTxt(
        'https://example.com',
        [],
        [{ title: 'Custom', slug: 'custom', description: 'Desc', content: 'Body' }],
      );
      expect(fullText).toContain(
        'Delisha Marie is a modern culinary destination offering tested, approachable recipes for home cooks and bakers everywhere.',
      );
      expect(fullText).toContain(
        'Kitchen FAQs covering baking conversions, ingredient substitutions, and cooking temperature guides.',
      );
      expect(fullText).toContain('### Custom');
      expect(fullText).toContain('- **Description**: Desc');
      expect(fullText).toContain('Body');
    });

    it('generateLlmsTxt and formatFullRecipe should format content properly', () => {
      const txt = generateLlmsTxt(
        'https://example.com',
        mockRecipesData as never,
        mockPagesData as never,
        { hasHolidays: true, hasSpecialDiets: true, hasTheBest: true },
      );
      expect(txt).toContain('# Delisha Marie');
      expect(txt).toContain('Classic Chocolate Cake');
      expect(txt).toContain('- [Holiday Recipes](https://example.com/holidays)');
      expect(txt).toContain('- [Special Diets](https://example.com/special-diets)');
      expect(txt).toContain('- [The Best Recipes](https://example.com/the-best-recipes)');

      // When counts are false/empty, those links must NOT appear
      const txtWithoutOptional = generateLlmsTxt(
        'https://example.com',
        mockRecipesData as never,
        mockPagesData as never,
        { hasHolidays: false, hasSpecialDiets: false, hasTheBest: false },
      );
      expect(txtWithoutOptional).toContain('- [All Recipes](https://example.com/recipes)');
      expect(txtWithoutOptional).toContain('- [Cooking Methods](https://example.com/methods)');
      expect(txtWithoutOptional).not.toContain('/holidays');
      expect(txtWithoutOptional).not.toContain('/special-diets');
      expect(txtWithoutOptional).not.toContain('/the-best-recipes');

      const recipeDoc = formatFullRecipe(mockRecipesData[0] as never, 'https://example.com');
      expect(recipeDoc).toContain('### Classic Chocolate Cake');
      expect(recipeDoc).toContain('- **Cuisine**: American');
    });

    it('htmlToMarkdown should convert HTML tags to markdown format', () => {
      expect(htmlToMarkdown(null)).toBe('');
      expect(htmlToMarkdown(undefined)).toBe('');

      const html = `
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <p>Check <a href="https://delishamarie.com">this link</a>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <div class="test">Some extra text &amp; symbols &lt;hello&gt; &quot;quote&quot; &#39;apostrophe&#39; &nbsp; here.</div>
      `;

      const md = htmlToMarkdown(html);
      expect(md).toContain('# Title');
      expect(md).toContain('## Subtitle');
      expect(md).toContain('**bold** and *italic* text.');
      expect(md).toContain('[this link](https://delishamarie.com)');
      expect(md).toContain('- Item 1');
      expect(md).toContain('& symbols <hello> "quote" \'apostrophe\'   here.');
      expect(md).not.toContain('<h1');
      expect(md).not.toContain('<p');
      expect(md).not.toContain('<div');

      // Test arrays and objects (e.g. JSON notes from Supabase)
      expect(htmlToMarkdown(['note line 1', 'note line 2'])).toBe('note line 1\n\nnote line 2');
      expect(htmlToMarkdown([{ text: 'note from object' }])).toBe('note from object');
      expect(htmlToMarkdown({ text: 'sample object note' })).toBe('sample object note');
      expect(htmlToMarkdown({ notes: 'sample notes field' })).toBe('sample notes field');
      expect(htmlToMarkdown(12345)).toBe('12345');
    });

    it('getHomeUrl should route to port 4220 on localhost in development', () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_ENV'];

      const localReq = {
        headers: {
          host: 'localhost:4200',
        },
      } as unknown as VercelRequest;

      expect(getHomeUrl('/about', localReq)).toBe('http://localhost:4220/about');
      expect(getHomeUrl('contact', localReq)).toBe('http://localhost:4220/contact');

      // In production/preview or when SITE_URL is set, uses production base
      process.env['SITE_URL'] = 'https://delishamarie.com';
      expect(getHomeUrl('/about', localReq)).toBe('https://delishamarie.com/about');
      expect(getHomeUrl('/contact', localReq)).toBe('https://delishamarie.com/contact');
    });

    it('llmsHandler should use http://localhost:4220 for About and Contact when running locally', async () => {
      delete process.env['SITE_URL'];
      delete process.env['VERCEL_ENV'];

      const localReqHandler = createRequestMock(llmsHandler);
      const res = await localReqHandler({
        headers: {
          host: 'localhost:4200',
        },
      }).get('/llms.txt');

      expect(res.status).toBe(200);
      expect(res.text).toContain('- [About Delisha Marie](http://localhost:4220/about)');
      expect(res.text).toContain('- [Contact](http://localhost:4220/contact)');
    });

    it('hasKitchenPrefix should detect kitchen prefix across paths, baseUrls and ROBOTS_TXT', () => {
      expect(hasKitchenPrefix('/kitchen/llms.txt')).toBe(true);
      expect(hasKitchenPrefix('/api/kitchen/extra')).toBe(true);
      expect(hasKitchenPrefix('/llms.txt', 'https://delishamarie.com/kitchen')).toBe(true);
      process.env['SITE_URL'] = 'https://delishamarie.com/kitchen';
      expect(hasKitchenPrefix('/llms.txt')).toBe(true);
      delete process.env['SITE_URL'];
      expect(
        hasKitchenPrefix(
          '/llms.txt',
          'https://delishamarie.com',
          '{"sitemap":["/kitchen/sitemap.xml"]}',
        ),
      ).toBe(true);
      expect(hasKitchenPrefix('/llms.txt', 'https://delishamarie.com', '{"rules":[]}')).toBe(false);
      expect(hasKitchenPrefix(undefined, undefined, '')).toBe(false);
    });

    it('generateLlmsTxt handles empty category counts and extra pages gracefully', () => {
      const text = generateLlmsTxt('https://example.com', mockRecipesData, []);
      expect(text).toContain('# Delisha Marie');
      expect(text).not.toContain('Holiday Recipes');
      expect(text).not.toContain('Special Diets');
      expect(text).not.toContain('The Best Recipes');

      const textWithEmptyPages = generateLlmsTxt(
        'https://example.com',
        [],
        [{ title: 'Home', slug: 'home' }],
      );
      expect(textWithEmptyPages).not.toContain('## Published Recipes');
    });

    it('getHomeUrl handles undefined req and explicit fallbackBaseUrl', () => {
      expect(getHomeUrl('/about', undefined, 'https://fallback.com')).toBe(
        'https://fallback.com/about',
      );
      expect(getHomeUrl('/about', undefined, '')).toBe('/about');
    });
  });
});
