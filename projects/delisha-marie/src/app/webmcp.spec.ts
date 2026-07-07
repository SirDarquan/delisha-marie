/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { initializeWebMCPPolyfill, cleanupWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
import { withRecipes } from './webmcp';
import { Api } from './services/api';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('WebMCP Integration', () => {
  let mockApi: any;

  beforeEach(() => {
    // Install the polyfill with testing shim so we can execute tools
    initializeWebMCPPolyfill({ installTestingShim: true });

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
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('searchRecipes');
  });

  it('should successfully register the tool in the browser modelContext', async () => {
    const tools = withRecipes();
    // Register the tool with the polyfill
    document.modelContext?.registerTool(tools[0] as any);

    // Verify registration via polyfill's testing shim
    const registeredTools = await (navigator as any).modelContextTesting?.listTools();
    expect(registeredTools).toBeTruthy();
    expect(registeredTools.some((t: any) => t.name === 'searchRecipes')).toBe(true);
  });

  it('should execute the tool correctly via navigator.modelContextTesting', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };

    // We must bind `execute` to run in the injection context so `inject(Api)` works
    const originalExecute = tool.execute;
    tool.execute = (args: any) => TestBed.runInInjectionContext(() => originalExecute(args));

    document.modelContext?.registerTool(tool as any);

    // Call it through the polyfill API natively
    const responseJson = await (navigator as any).modelContextTesting?.executeTool(
      'searchRecipes',
      JSON.stringify({ query: 'cake', page: 2, pageSize: 20 }),
    );

    expect(responseJson).toBeTruthy();

    // Robustly unwrap stringified payloads
    let result: any = responseJson;
    while (typeof result === 'string') {
      result = JSON.parse(result);
    }
    if (result?.content?.[0]?.text) {
      let text = result.content[0].text;
      while (typeof text === 'string') {
        try {
          text = JSON.parse(text);
        } catch {
          break;
        }
      }
      result = text;
    }
    console.log('DEBUG responseJson:', responseJson);
    console.log('DEBUG result:', result);
    expect(result.items).toBeDefined();
    expect(result.items[0].title).toBe('Cake');
    expect(result.items[0].url).toContain('/recipe/cake');

    expect(mockApi.post).toHaveBeenCalledWith('/api/recipes/search', {
      query: 'cake',
      page: 2,
      pageSize: 20,
    });
  });

  it('should safely construct absolute image URLs and execute with default pagination', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };
    const originalExecute = tool.execute;
    tool.execute = (args: any) => TestBed.runInInjectionContext(() => originalExecute(args));

    // Register the tool
    document.modelContext?.registerTool(tool as any);

    // Call with only the required `query` argument (defaults should take over)
    await (navigator as any).modelContextTesting?.executeTool(
      'searchRecipes',
      JSON.stringify({ query: 'pie' }),
    );

    expect(mockApi.post).toHaveBeenCalledWith('/api/recipes/search', {
      query: 'pie',
      page: 1, // Default fallback
      pageSize: 12, // Default fallback
    });
  });

  it('should handle undefined query, missing image, and external image URLs', async () => {
    const tools = withRecipes();
    const tool = { ...tools[0] };
    const originalExecute = tool.execute;
    tool.execute = (args: any) => TestBed.runInInjectionContext(() => originalExecute(args));

    // Update mock to return missing image and external image
    mockApi.post.mockResolvedValueOnce({
      items: [
        { title: 'No Image', slug: 'no-image' },
        { title: 'Ext Image', slug: 'ext', image: 'https://example.com/img.jpg' },
      ],
      total: 2,
    });

    document.modelContext?.registerTool(tool as any);

    // Call without query
    const responseJson = await (navigator as any).modelContextTesting?.executeTool(
      'searchRecipes',
      JSON.stringify({}), // empty args
    );

    expect(mockApi.post).toHaveBeenCalledWith('/api/recipes/search', {
      query: '', // defaults to empty string
      page: 1,
      pageSize: 12,
    });

    let result: any = responseJson;
    while (typeof result === 'string') {
      result = JSON.parse(result);
    }
    if (result?.content?.[0]?.text) {
      let text = result.content[0].text;
      while (typeof text === 'string') {
        try {
          text = JSON.parse(text);
        } catch {
          break;
        }
      }
      result = text;
    }
    expect(result.items).toBeDefined();
    expect(result.items[0].image).toBeUndefined();
    expect(result.items[1].image).toBe('https://example.com/img.jpg');
  });
});
