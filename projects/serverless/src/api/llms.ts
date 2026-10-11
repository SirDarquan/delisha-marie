import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

export interface LlmsRecipe {
  title: string;
  slug: string;
  description?: unknown;
  prep_time?: string | null;
  cook_time?: string | null;
  total_time?: string | null;
  yield?: string | null;
  cuisine?: string | null;
  course?: string | null;
  method?: string | null;
  the_best?: boolean | null;
  recipe_holidays?: unknown;
  recipe_special_diets?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
  notes?: unknown;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface LlmsPage {
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  updated_at?: string | null;
}

export interface LlmsCategoryCounts {
  hasHolidays?: boolean;
  hasSpecialDiets?: boolean;
  hasTheBest?: boolean;
}

export function getBaseUrl(req: VercelRequest): string {
  let base: string;
  const vercelEnv = process.env['VERCEL_ENV'];
  if (process.env['SITE_URL']) {
    base = process.env['SITE_URL'];
  } else if (vercelEnv === 'preview') {
    base = `https://${process.env['VERCEL_URL']}`;
  } else if (vercelEnv === 'production') {
    base = `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  } else {
    const proto = req.headers?.['x-forwarded-proto'] || 'https';
    const host = req.headers?.['host'] || 'localhost';
    base = `${proto}://${host}`;
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function hasKitchenPrefix(
  rawPath?: string,
  baseUrl?: string,
  robotsTxtEnv?: string,
): boolean {
  if (rawPath && (rawPath.startsWith('/kitchen') || rawPath.includes('/kitchen/'))) {
    return true;
  }
  if (baseUrl?.includes('/kitchen')) {
    return true;
  }
  if (process.env['SITE_URL']?.includes('/kitchen')) {
    return true;
  }
  const robotsEnv = robotsTxtEnv ?? process.env['ROBOTS_TXT'] ?? '';
  return robotsEnv.includes('/kitchen');
}

export function normalizeIngredients(ingredients: unknown): string[] {
  if (Array.isArray(ingredients)) {
    return ingredients
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (typeof item === 'object' && item !== null) {
          const rec = item as Record<string, unknown>;
          const name = rec['name'] || rec['ingredient'] || rec['item'] || '';
          const amount = rec['amount'] || rec['quantity'] || '';
          const unit = rec['unit'] || '';
          const text = `${amount} ${unit} ${name}`.replace(/\s+/g, ' ').trim();
          return text || (typeof rec['text'] === 'string' ? rec['text'] : '');
        }
        return '';
      })
      .filter((s) => s.length > 0);
  }
  if (typeof ingredients === 'string') {
    return ingredients
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

export function normalizeInstructions(instructions: unknown): string[] {
  if (Array.isArray(instructions)) {
    return instructions
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (typeof item === 'object' && item !== null) {
          const rec = item as Record<string, unknown>;
          const text = rec['text'] || rec['instruction'] || rec['step'] || '';
          return typeof text === 'string' ? text.trim() : '';
        }
        return '';
      })
      .filter((s) => s.length > 0);
  }
  if (typeof instructions === 'string') {
    return instructions
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

function toStringContent(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object' && item !== null) {
          const rec = item as Record<string, unknown>;
          return (
            (typeof rec['text'] === 'string' ? rec['text'] : '') ||
            (typeof rec['note'] === 'string' ? rec['note'] : '') ||
            (typeof rec['notes'] === 'string' ? rec['notes'] : '') ||
            (typeof rec['content'] === 'string' ? rec['content'] : '') ||
            ''
          ).trim();
        }
        return '';
      })
      .filter((s) => s.length > 0)
      .join('\n\n');
  }
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    const extracted =
      (typeof obj['text'] === 'string' ? obj['text'] : '') ||
      (typeof obj['notes'] === 'string' ? obj['notes'] : '') ||
      (typeof obj['note'] === 'string' ? obj['note'] : '') ||
      (typeof obj['content'] === 'string' ? obj['content'] : '');
    return extracted.trim();
  }
  return String(input);
}

export function htmlToMarkdown(html?: unknown): string {
  if (html === null || html === undefined) return '';

  const text = toStringContent(html);
  if (!text.trim()) return '';

  return (
    text
      // Headings: <h1>Header</h1> -> # Header
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
        const hashes = '#'.repeat(Number(level));
        return `\n\n${hashes} ${content.trim()}\n\n`;
      })
      // Links: <a href="url">text</a> -> [text](url)
      .replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, '[$3]($2)')
      // Bold / Strong
      .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
      // Italics / Em
      .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
      // List items: <li>item</li> -> - item
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
      // Paragraphs: <p>...</p> -> ...\n\n
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Strip remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode common HTML entities
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&nbsp;', ' ')
      // Normalize excess whitespace and line breaks
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export function getHomeUrl(path = '', req?: VercelRequest, fallbackBaseUrl?: string): string {
  const host = req?.headers?.['host'] || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const isProd =
    process.env['VERCEL_ENV'] === 'production' ||
    process.env['VERCEL_ENV'] === 'preview' ||
    Boolean(process.env['SITE_URL']);

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (isLocal && !isProd) {
    return `http://localhost:4220${cleanPath}`;
  }

  const base = fallbackBaseUrl || (req ? getBaseUrl(req) : '');
  return `${base}${cleanPath}`;
}

export function formatFullRecipe(recipe: LlmsRecipe, baseUrl: string): string {
  const lines: string[] = [
    `### ${recipe.title}`,
    `- **URL**: ${baseUrl}/recipe/${recipe.slug}`,
    ...(recipe.description ? [`- **Description**: ${htmlToMarkdown(recipe.description)}`] : []),
    ...(recipe.prep_time ? [`- **Prep Time**: ${recipe.prep_time}`] : []),
    ...(recipe.cook_time ? [`- **Cook Time**: ${recipe.cook_time}`] : []),
    ...(recipe.total_time ? [`- **Total Time**: ${recipe.total_time}`] : []),
    ...(recipe.yield ? [`- **Servings**: ${recipe.yield}`] : []),
    ...(recipe.cuisine ? [`- **Cuisine**: ${recipe.cuisine}`] : []),
    ...(recipe.course ? [`- **Course**: ${recipe.course}`] : []),
    ...(recipe.method ? [`- **Method**: ${recipe.method}`] : []),
  ];

  const ingredients = normalizeIngredients(recipe.ingredients);
  if (ingredients.length > 0) {
    lines.push('', '#### Ingredients', ...ingredients.map((ing) => `- ${ing}`));
  }

  const instructions = normalizeInstructions(recipe.instructions);
  if (instructions.length > 0) {
    lines.push('', '#### Instructions', ...instructions.map((inst, idx) => `${idx + 1}. ${inst}`));
  }

  const notesMarkdown = htmlToMarkdown(recipe.notes);
  if (notesMarkdown) {
    lines.push('', `#### Notes\n${notesMarkdown}`);
  }

  return lines.join('\n');
}

export function generateLlmsTxt(
  baseUrl: string,
  recipes: LlmsRecipe[],
  pages: LlmsPage[],
  categoryCounts?: LlmsCategoryCounts,
  req?: VercelRequest,
): string {
  const aboutUrl = getHomeUrl('/about', req, baseUrl);
  const contactUrl = getHomeUrl('/contact', req, baseUrl);

  const sections: string[] = [
    '# Delisha Marie\n',
    '> A premier modern cooking and baking blog offering tested recipes, culinary inspiration, and step-by-step guides by Delisha Marie.\n',
    'Delisha Marie features foolproof everyday meals, celebration menus, and artisan baking. All recipes feature tested ingredient quantities, detailed preparation steps, and dietary classifications.\n',
    '## Main Pages',
    `- [Home](${baseUrl}/): Welcome hub featuring latest recipes, top rated creations, and seasonal favorites.`,
    `- [Recipe Directory](${baseUrl}/recipe-index): Comprehensive index of all recipes categorized by cuisine, cooking method, holiday, and special diet.`,
    `- [About Delisha Marie](${aboutUrl}): Culinary background, philosophy, and story of Delisha Marie.`,
    `- [Contact](${contactUrl}): Inquiries, feedback, and collaboration form.`,
    `- [FAQ](${baseUrl}/faq): Frequently asked questions on baking conversions, ingredient substitutions, and kitchen equipment.`,
    `- [Privacy Policy](${baseUrl}/privacy-policy): Privacy and data handling policies.`,
  ];

  const standardSlugs = new Set([
    'about',
    'contact',
    'faq',
    'privacy-policy',
    'home',
    'recipe-index',
    'search',
    'thank-you',
    '404',
    'not-found',
  ]);

  if (pages.length > 0) {
    const extraPages = pages
      .filter((page) => !standardSlugs.has(page.slug))
      .map(
        (page) =>
          `- [${page.title}](${baseUrl}/${page.slug}): ${htmlToMarkdown(page.description) || 'Page on Delisha Marie.'}`,
      );
    if (extraPages.length > 0) {
      sections.push(...extraPages);
    }
  }

  if (recipes.length > 0) {
    const categoryLinks: string[] = [
      `- [All Recipes](${baseUrl}/recipes): Browse all recipe collections.`,
      `- [Cooking Methods](${baseUrl}/methods): Recipes organized by cooking method (Baking, Grilling, Air Fryer, Slow Cooker, Stovetop, etc.).`,
    ];

    if (categoryCounts?.hasHolidays) {
      categoryLinks.push(
        `- [Holiday Recipes](${baseUrl}/holidays): Festive holiday celebration menus and seasonal desserts.`,
      );
    }

    if (categoryCounts?.hasSpecialDiets) {
      categoryLinks.push(
        `- [Special Diets](${baseUrl}/special-diets): Vegetarian, vegan, gluten-free, and diet-specific dishes.`,
      );
    }

    if (categoryCounts?.hasTheBest) {
      categoryLinks.push(
        `- [The Best Recipes](${baseUrl}/the-best-recipes): Curated top-rated recipes and crowd favorites.`,
      );
    }

    sections.push(
      '\n## Recipe Categories & Methods',
      ...categoryLinks,
      '\n## Published Recipes',
      ...recipes.map((recipe) => {
        const desc = htmlToMarkdown(recipe.description) || 'Delicious recipe by Delisha Marie.';
        return `- [${recipe.title}](${baseUrl}/recipe/${recipe.slug}): ${desc}`;
      }),
    );
  }

  sections.push(
    '\n## Full Context',
    `- [Full LLM Context](${baseUrl}/llms-full.txt): Complete recipes with ingredients, measurements, instructions, and full page texts for LLM ingestion.`,
  );

  return sections.join('\n');
}

export function generateLlmsFullTxt(
  baseUrl: string,
  recipes: LlmsRecipe[],
  pages: LlmsPage[],
  req?: VercelRequest,
): string {
  const sections: string[] = [
    '# Delisha Marie - Full Context\n',
    '> Comprehensive repository of all published recipes, ingredient measurements, step-by-step instructions, and site pages for Delisha Marie.\n',
  ];

  if (recipes.length > 0) {
    sections.push(
      '---\n',
      '## Recipes\n',
      recipes.map((r) => formatFullRecipe(r, baseUrl)).join('\n\n---\n\n'),
    );
  }

  const aboutPage = pages.find((p) => p.slug === 'about');
  const aboutUrl = getHomeUrl('/about', req, baseUrl);
  const aboutContent =
    htmlToMarkdown(aboutPage?.content) ||
    'Delisha Marie is a modern culinary destination offering tested, approachable recipes for home cooks and bakers everywhere.';

  const contactPage = pages.find((p) => p.slug === 'contact');
  const contactUrl = getHomeUrl('/contact', req, baseUrl);
  const contactContent =
    htmlToMarkdown(contactPage?.content) ||
    'Get in touch with Delisha Marie for inquiries, partnerships, and recipe questions.';

  const faqPage = pages.find((p) => p.slug === 'faq');
  const faqContent =
    htmlToMarkdown(faqPage?.content) ||
    'Kitchen FAQs covering baking conversions, ingredient substitutions, and cooking temperature guides.';

  const privacyPage = pages.find((p) => p.slug === 'privacy-policy');

  sections.push(
    '---\n',
    '## Information Pages\n',
    '### About Delisha Marie',
    `- **URL**: ${aboutUrl}`,
    aboutContent,
    '',
    '### Contact',
    `- **URL**: ${contactUrl}`,
    contactContent,
    '',
    '### FAQ & Kitchen Tips',
    `- **URL**: ${baseUrl}/faq`,
    faqContent,
    '',
  );

  if (privacyPage) {
    const privacyContent =
      htmlToMarkdown(privacyPage.content) ||
      'Privacy and data handling policies for Delisha Marie visitors.';
    sections.push('### Privacy Policy', `- **URL**: ${baseUrl}/privacy-policy`, privacyContent, '');
  }

  const handledSlugs = new Set([
    'about',
    'contact',
    'faq',
    'privacy-policy',
    'thank-you',
    '404',
    'not-found',
  ]);
  const otherPages = pages.filter((page) => !handledSlugs.has(page.slug));
  for (const page of otherPages) {
    const pageDesc = htmlToMarkdown(page.description);
    const pageBody = htmlToMarkdown(page.content);
    sections.push(
      `### ${page.title}`,
      `- **URL**: ${baseUrl}/${page.slug}`,
      ...(pageDesc ? [`- **Description**: ${pageDesc}`] : []),
      ...(pageBody ? [`\n${pageBody}`] : []),
      '',
    );
  }

  return sections.join('\n');
}

export default async function llmsHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
  const rawPath = (req.query?.['path'] as string | undefined) || url.pathname;
  const isFull =
    req.query?.['full'] === 'true' || req.query?.['full'] === '1' || rawPath.includes('llms-full');

  const prefixMatch = /^(.*)\/llms(-full)?(\.txt)?$/.exec(rawPath);
  let prefix = prefixMatch?.[1] ?? '';

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  const isDev = !process.env['VERCEL_ENV'] && !process.env['SITE_URL'];
  res.setHeader(
    'Cache-Control',
    isDev
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  );

  try {
    const rawBaseUrl = getBaseUrl(req);
    if (!prefix && hasKitchenPrefix(rawPath, rawBaseUrl)) {
      prefix = '/kitchen';
    }
    const baseUrl = rawBaseUrl.endsWith('/kitchen') ? rawBaseUrl : `${rawBaseUrl}${prefix}`;
    const supabase = await getSupabaseClient();

    const [recipesResult, pagesResult, holidaysCountResult, dietsCountResult, theBestCountResult] =
      await Promise.all([
        supabase
          .from('recipes')
          .select(
            'id, title, slug, description, content, prep_time, cook_time, total_time, yield, cuisine, course, method, ingredients, instructions, notes, updated_at, created_at',
          )
          .eq('status', 'published')
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('pages')
          .select('title, slug, description, content, updated_at')
          .order('title', { ascending: true }),
        supabase
          .from('recipe_holidays')
          .select('recipes!inner(status, created_at)', { count: 'exact', head: true })
          .eq('recipes.status', 'published')
          .lte('recipes.created_at', new Date().toISOString()),
        supabase
          .from('recipe_special_diets')
          .select('recipes!inner(status, created_at)', { count: 'exact', head: true })
          .eq('recipes.status', 'published')
          .lte('recipes.created_at', new Date().toISOString()),
        supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
          .eq('the_best', true)
          .lte('created_at', new Date().toISOString()),
      ]);

    const recipes = (recipesResult.data || []) as LlmsRecipe[];
    const pages = ((pagesResult.data || []) as LlmsPage[]).filter(
      (p) => p.slug !== 'thank-you' && p.slug !== '404' && p.slug !== 'not-found',
    );

    const categoryCounts: LlmsCategoryCounts = {
      hasHolidays: (holidaysCountResult.count ?? 0) > 0,
      hasSpecialDiets: (dietsCountResult.count ?? 0) > 0,
      hasTheBest: (theBestCountResult.count ?? 0) > 0,
    };

    const markdown = isFull
      ? generateLlmsFullTxt(baseUrl, recipes, pages, req)
      : generateLlmsTxt(baseUrl, recipes, pages, categoryCounts, req);

    res.status(200).send(markdown);
  } catch (err: unknown) {
    console.error('Error generating LLM document:', err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    res.status(500).json({
      error: 'Failed to generate LLM context',
      details: message,
      stack: process.env['NODE_ENV'] !== 'production' ? stack : undefined,
    });
  }
}
