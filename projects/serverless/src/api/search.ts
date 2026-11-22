import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

export interface SearchOptions {
  query: string;
  page?: number;
  pageSize?: number;
  tenantId?: string;
}

export interface SearchResultItem {
  id: string | number;
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
  similarity?: number;
  [key: string]: unknown;
}

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
}

export interface SearchProvider {
  search(options: SearchOptions): Promise<SearchResponse>;
}

interface AlgoliaHit extends Record<string, unknown> {
  objectID?: string;
  id?: string | number;
  title?: string;
  slug?: string;
  description?: string;
  image?: string;
  similarity?: number;
}

interface AlgoliaQueryResponse {
  hits?: AlgoliaHit[];
  nbHits?: number;
  page?: number;
  nbPages?: number;
  hitsPerPage?: number;
  [key: string]: unknown;
}

export class AlgoliaSearchProvider implements SearchProvider {
  async search(options: SearchOptions): Promise<SearchResponse> {
    const appId = process.env['ALGOLIA_APP_ID'];
    const apiKey = process.env['ALGOLIA_API_KEY'];
    const indexName = process.env['ALGOLIA_INDEX_NAME'] || 'supabase_recipe_index';

    if (!appId || !apiKey) {
      throw new Error('Algolia App ID and API Key are required. Check environment variables.');
    }

    const tenantId =
      options.tenantId || process.env['ALGOLIA_TENANT_ID'] || process.env['TENANT_ID'];

    const pageIndex = Math.max(0, (options.page ?? 1) - 1);
    const hitsPerPage = options.pageSize ?? 12;

    const nowIso = new Date().toISOString();
    const nowUnix = Math.floor(Date.now() / 1000);
    const filterClauses: string[] = [];
    if (tenantId) {
      filterClauses.push(`tenant_id:'${tenantId}'`);
    }
    filterClauses.push(`status:published`);
    const filters = filterClauses.join(' AND ');

    const endpoint = `https://${appId}.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`;
    const headers = {
      'x-algolia-application-id': appId,
      'x-algolia-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: options.query,
        filters,
        hitsPerPage,
        page: pageIndex,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Algolia query failed with status ${response.status}: ${errorText}`);
      throw new Error(`Algolia query failed with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as AlgoliaQueryResponse;
    const rawHits = data.hits || [];

    const validHits = rawHits.filter((hit) => {
      const createdAt = hit['created_at'];
      if (typeof createdAt === 'string' && createdAt > nowIso) {
        return false;
      }
      if (typeof createdAt === 'number' && createdAt > nowUnix) {
        return false;
      }
      return true;
    });

    const items: SearchResultItem[] = validHits.map((hit) => {
      const { objectID, ...rest } = hit;
      return {
        id: hit.id ?? objectID ?? '',
        ...rest,
      };
    });

    const excludedCount = rawHits.length - items.length;
    const total = Math.max(0, (data.nbHits ?? items.length) - excludedCount);

    return {
      items,
      total,
    };
  }
}

export class SupabaseSearchProvider implements SearchProvider {
  async search(options: SearchOptions): Promise<SearchResponse> {
    const supabase = await getSupabaseClient();
    const { query, page = 1, pageSize = 12 } = options;

    const { data, error } = await supabase.functions.invoke('search-recipes', {
      body: { query, page, pageSize },
    });

    if (error) {
      throw error;
    }

    const recipes = (data?.recipes as Record<string, unknown>[]) || [];
    const nowIso = new Date().toISOString();

    let validIdSet: Set<string>;
    const recipeIds = recipes
      .map((r) => r['id'])
      .filter((id): id is string | number => id !== undefined && id !== null)
      .map(String);

    if (recipeIds.length > 0) {
      const { data: liveRecipes, error: dbError } = await supabase
        .from('recipes')
        .select('id')
        .in('id', recipeIds)
        .eq('status', 'published')
        .lte('created_at', nowIso);

      if (dbError) {
        throw dbError;
      }

      validIdSet = new Set((liveRecipes || []).map((lr: { id: string | number }) => String(lr.id)));
    } else {
      validIdSet = new Set();
    }

    const items = recipes
      .filter((r) => {
        if (!validIdSet.has(String(r['id']))) {
          return false;
        }
        if (typeof r['created_at'] === 'string' && r['created_at'] > nowIso) {
          return false;
        }
        if (r['status'] && r['status'] !== 'published') {
          return false;
        }
        return true;
      })
      .map((r: Record<string, unknown>) => {
        const rCopy = { ...r };
        delete rCopy['total_count'];
        return rCopy as SearchResultItem;
      });

    const excludedCount = recipes.length - items.length;
    const total = Math.max(0, (data?.total || 0) - excludedCount);

    return {
      items,
      total,
    };
  }
}

export const algoliaSearchProvider = new AlgoliaSearchProvider();
export const supabaseSearchProvider = new SupabaseSearchProvider();

export function resolveSearchProvider(): SearchProvider {
  const providerSetting = process.env['SEARCH_PROVIDER']?.toLowerCase();
  if (providerSetting === 'algolia') {
    return algoliaSearchProvider;
  }
  if (providerSetting === 'supabase') {
    return supabaseSearchProvider;
  }

  // Auto-detect: prefer Algolia if credentials exist, fallback to Supabase
  if (process.env['ALGOLIA_APP_ID'] && process.env['ALGOLIA_API_KEY']) {
    return algoliaSearchProvider;
  }

  return supabaseSearchProvider;
}

export default async function search(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query, page = 1, pageSize = 12, tenantId } = req.body || {};

    if (query === undefined || query === null || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const provider = resolveSearchProvider();
    const result = await provider.search({
      query,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 12,
      tenantId,
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
}
