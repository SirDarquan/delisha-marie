import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { initializeWebMCPPolyfill, cleanupWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
import { withRecipes } from './webmcp';
import { Api } from './services/api';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

interface ModelContextTesting {
  listTools: () => Promise<{ name: string }[]>;
  executeTool: (name: string, args: string) => Promise<unknown>;
}

describe('WebMCP Integration', () => {
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;
  let nav: { modelContextTesting?: ModelContextTesting };

  beforeEach(() => {
    // Install the polyfill with testing shim so we can execute tools
    initializeWebMCPPolyfill({ installTestingShim: true });

    nav = navigator as unknown as { modelContextTesting?: ModelContextTesting };

    mockApi = {
      post: vi.fn().mockResolvedValue({
        items: [{ title: 'Cake', slug: 'cake', image: 'cake.jpg' }],
        total: 1,
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Api, useValue: mockApi },
        { provide: DOCUMENT, useValue: document },
      ],
    });
  });

  afterEach(() => {
    cleanupWebMCPPolyfill();
    vi.clearAllMocks();
  });

  it('should return searchRecipes tool metadata', () => {
    const tools = withRecipes();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('searchRecipes');
  });

  it('should successfully register the tool in the browser modelContext', async () => {
    const tools = withRecipes();
    // Register the tool with the polyfill
    document.modelContext?.registerTool(
      tools[0] as unknown as Parameters<
        NonNullable<typeof document.modelContext>['registerTool']
      >[0],
    );

    // Verify registration via polyfill's testing shim
    const registeredTools = await nav.modelContextTesting?.listTools();
    expect(registeredTools).toBeTruthy();
    expect(registeredTools?.some((t: { name: string }) => t.name === 'searchRecipes')).toBe(true);
  });

  it('should execute the tool correctly via navigator.modelContextTesting', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };

    // We must bind `execute` to run in the injection context so `inject(Api)` works
    const originalExecute = tool.execute as (args: {
      query?: string;
      page?: number;
      pageSize?: number;
    }) => Promise<string>;
    tool.execute = (args: { query?: string; page?: number; pageSize?: number }) =>
      TestBed.runInInjectionContext(() => originalExecute(args));

    document.modelContext?.registerTool(
      tool as unknown as Parameters<NonNullable<typeof document.modelContext>['registerTool']>[0],
    );

    // Call it through the polyfill API natively
    const responseJson = await nav.modelContextTesting?.executeTool(
      'searchRecipes',
      JSON.stringify({ query: 'cake', page: 2, pageSize: 20 }),
    );

    expect(responseJson).toBeTruthy();

    // Robustly unwrap stringified payloads
    let result: unknown = responseJson;
    while (typeof result === 'string') {
      result = JSON.parse(result);
    }
    const resObj = result as {
      content?: { text: unknown }[];
      items?: { title: string; url: string }[];
    };
    if (resObj?.content?.[0]?.text) {
      let text = resObj.content[0].text;
      while (typeof text === 'string') {
        try {
          text = JSON.parse(text);
        } catch {
          break;
        }
      }
      result = text;
    }
    const finalResult = result as { items?: { title: string; url: string }[] };
    expect(finalResult.items).toBeDefined();
    expect(finalResult.items![0].title).toBe('Cake');
    expect(finalResult.items![0].url).toContain('/recipe/cake');

    expect(mockApi['post']).toHaveBeenCalledWith('/search', {
      query: 'cake',
      page: 2,
      pageSize: 20,
    });
  });

  it('should safely construct absolute image URLs and execute with default pagination', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };
    const originalExecute = tool.execute as (args: {
      query?: string;
      page?: number;
      pageSize?: number;
    }) => Promise<string>;
    tool.execute = (args: { query?: string; page?: number; pageSize?: number }) =>
      TestBed.runInInjectionContext(() => originalExecute(args));

    // Register the tool
    document.modelContext?.registerTool(
      tool as unknown as Parameters<NonNullable<typeof document.modelContext>['registerTool']>[0],
    );

    // Call with only the required `query` argument (defaults should take over)
    await nav.modelContextTesting?.executeTool('searchRecipes', JSON.stringify({ query: 'pie' }));

    expect(mockApi['post']).toHaveBeenCalledWith('/search', {
      query: 'pie',
      page: 1, // Default fallback
      pageSize: 12, // Default fallback
    });
  });

  it('should handle undefined query, missing image, and external image URLs', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };
    const originalExecute = tool.execute as (args: {
      query?: string;
      page?: number;
      pageSize?: number;
    }) => Promise<string>;
    tool.execute = (args: { query?: string; page?: number; pageSize?: number }) =>
      TestBed.runInInjectionContext(() => originalExecute(args));

    // Update mock to return missing image and external image
    mockApi['post'].mockResolvedValueOnce({
      items: [
        { title: 'No Image', slug: 'no-image' },
        { title: 'Ext Image', slug: 'ext', image: 'https://example.com/img.jpg' },
      ],
      total: 2,
    });

    document.modelContext?.registerTool(
      tool as unknown as Parameters<NonNullable<typeof document.modelContext>['registerTool']>[0],
    );

    // Call without query
    const responseJson = await nav.modelContextTesting?.executeTool(
      'searchRecipes',
      JSON.stringify({}), // empty args
    );

    expect(mockApi['post']).toHaveBeenCalledWith('/search', {
      query: '', // defaults to empty string
      page: 1,
      pageSize: 12,
    });

    let result: unknown = responseJson;
    while (typeof result === 'string') {
      result = JSON.parse(result);
    }
    const resObj = result as {
      content?: { text: unknown }[];
      items?: { title: string; url: string; image: string }[];
    };
    if (resObj?.content?.[0]?.text) {
      let text = resObj.content[0].text;
      while (typeof text === 'string') {
        try {
          text = JSON.parse(text);
        } catch {
          break;
        }
      }
      result = text;
    }
    const finalResult = result as { items?: { title: string; url: string; image?: string }[] };
    expect(finalResult.items).toBeDefined();
    expect(finalResult.items![0].title).toBe('No Image');
    expect(finalResult.items![0].image).toBeUndefined();
    expect(finalResult.items![1].title).toBe('Ext Image');
    expect(finalResult.items![1].image).toBe('https://example.com/img.jpg');
  });
});
