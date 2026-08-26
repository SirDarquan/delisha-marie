import type { VercelRequest, VercelResponse } from '@vercel/node';
import { vi } from 'vitest';

export interface IndexItem {
  name: string;
  url: string;
  count: number;
  children: IndexItem[];
}

export interface MockResponseBody {
  error: string;
  items: {
    id: number | string;
    title: string;
    status: string;
    holidays: unknown[];
    specialDiets: unknown[];
    method: string;
    nestedData: {
      arrayField: { deepKey: string }[];
      primitiveField: string;
    };
  }[];
  total: number;
  id: string;
  recipeId: string;
  author: string;
  rating: number;
  website: string;
  parentId: string;
  status: string;
  comments: { id: string }[];
  GoogleTagManager: unknown;
  Sentry: unknown;
  categories: unknown[];
  subcategories: unknown[];
  methods: unknown[];
  title: string;
  length: number;
  breadcrumbs: {
    main: number;
    items: unknown[][];
  };
  navigation: {
    prev: { title: string; slug: string };
    next: { title: string; slug: string };
  };
  categoriesList: IndexItem[];
  cookingMethods: IndexItem[];
  holidays: IndexItem[];
  specialDiets: IndexItem[];
  bestRecipes: IndexItem[];
  ingredients: IndexItem[];
  [key: number]: { title: string };
}

export interface MockVercelResponse {
  statusCode: number;
  body: MockResponseBody;
  text: string;
  headers: Record<string, string>;
  status: unknown;
  json: unknown;
  send: unknown;
  setHeader: unknown;
}

function createMockResponse(): MockVercelResponse {
  const res = { headers: {} } as MockVercelResponse;
  res.statusCode = 200;
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res as unknown as VercelResponse;
  });
  res.json = vi.fn().mockImplementation((body: unknown) => {
    res.body = body as MockResponseBody;
    return res as unknown as VercelResponse;
  });
  res.send = vi.fn().mockImplementation((text: string) => {
    res.text = text;
    return res as unknown as VercelResponse;
  });
  res.setHeader = vi.fn().mockImplementation((name: string, value: string) => {
    res.headers[name.toLowerCase()] = value;
    return res as unknown as VercelResponse;
  });
  return res;
}

function createMockRequest(url: string, method = 'GET', body: unknown = {}) {
  return {
    method,
    url: 'http://localhost' + url,
    body,
    query: {},
    headers: { host: 'localhost' },
  } as unknown as VercelRequest;
}

export interface GetRequestChain extends PromiseLike<MockVercelResponse> {
  query: (q: Record<string, string | string[]>) => Promise<MockVercelResponse>;
  set: (k: string, v: string) => GetRequestChain;
}
export interface PostRequestChain extends PromiseLike<MockVercelResponse> {
  send: (b?: unknown) => Promise<MockVercelResponse>;
  set: (k: string, v: string) => PostRequestChain;
}

export function createRequestMock(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown> | void,
) {
  async function simulateRequest(
    method: string,
    url: string,
    {
      query = null as unknown,
      body = null as unknown,
      headers = {} as Record<string, string>,
    } = {},
  ) {
    const req = createMockRequest(url, method, body || {});
    Object.assign(req.headers, headers);
    const parsedUrl = new URL(req.url!, 'http://localhost');
    const urlParts = parsedUrl.pathname
      .replace(/^\/api/, '')
      .split('/')
      .filter(Boolean);
    const queryObj: Record<string, string | string[]> = {};
    parsedUrl.searchParams.forEach((val, key) => (queryObj[key] = val));

    if (urlParts.length > 0) {
      if (urlParts[0] === 'recipes' && urlParts.length > 1) {
        queryObj['slug'] = urlParts.length === 2 ? urlParts[1] : urlParts.slice(1);
      } else if (urlParts[0] === 'pages' && urlParts.length > 1) {
        queryObj['slug'] = urlParts[1];
      }
    }

    if (query) {
      Object.assign(queryObj, query as Record<string, string | string[]>);
    }

    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(queryObj)) {
      if (Array.isArray(v)) {
        v.forEach((val) => searchParams.append(k, val));
      } else {
        searchParams.set(k, v);
      }
    }
    req.url = req.url!.split('?')[0] + '?' + searchParams.toString();
    req.query = queryObj;

    const res = createMockResponse();
    await handler(req, res as unknown as VercelResponse);
    return {
      ...res,
      status: res.statusCode,
    };
  }

  return (app_?: unknown) => {
    void app_;
    return {
      get: (url: string) => {
        const hdrs: Record<string, string> = {};
        const chain = {
          query: (q: Record<string, string | string[]>) => {
            return simulateRequest('GET', url, { query: q, headers: hdrs });
          },
          set: (k: string, v: string) => {
            hdrs[k] = v;
            return chain;
          },
        };
        Object.defineProperty(chain, 'then', {
          value: function <TResult1 = MockVercelResponse, TResult2 = never>(
            onfulfilled?: ((value: MockVercelResponse) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
          ): Promise<TResult1 | TResult2> {
            return simulateRequest('GET', url, { headers: hdrs }).then(
              onfulfilled as unknown as (
                value: MockVercelResponse,
              ) => TResult1 | PromiseLike<TResult1>,
              onrejected,
            ) as unknown as Promise<TResult1 | TResult2>;
          },
        });
        return chain as unknown as GetRequestChain;
      },
      post: (url: string) => {
        const hdrs: Record<string, string> = {};
        let b: unknown = null;
        const chain = {
          send: (bodyObj?: unknown) => {
            b = bodyObj;
            return chain;
          },
          set: (k: string, v: string) => {
            hdrs[k] = v;
            return chain;
          },
        };
        Object.defineProperty(chain, 'then', {
          value: function <TResult1 = MockVercelResponse, TResult2 = never>(
            onfulfilled?: ((value: MockVercelResponse) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
          ): Promise<TResult1 | TResult2> {
            return simulateRequest('POST', url, { body: b, headers: hdrs }).then(
              onfulfilled as unknown as (
                value: MockVercelResponse,
              ) => TResult1 | PromiseLike<TResult1>,
              onrejected,
            ) as unknown as Promise<TResult1 | TResult2>;
          },
        });
        return chain as unknown as PostRequestChain;
      },
    };
  };
}
