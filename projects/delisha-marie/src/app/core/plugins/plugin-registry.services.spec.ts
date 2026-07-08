import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { PluginRegistry } from './plugin-registry.services';
import { APP_PLUGINS, AppPlugin } from './plugin.token';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  it('should do nothing during Server-Side Rendering (SSR)', async () => {
    const mockPlugin: AppPlugin = {
      id: 'test-plugin',
      init: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PluginRegistry,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: APP_PLUGINS, useValue: mockPlugin, multi: true },
      ],
    });

    registry = TestBed.inject(PluginRegistry);

    await registry.initAll();

    expect(mockPlugin.init).not.toHaveBeenCalled();
  });

  it('should sort plugins by order and run them sequentially in Browser mode', async () => {
    const callOrder: number[] = [];

    const plugin1: AppPlugin = {
      id: 'plugin-1',
      order: 5,
      init: async () => {
        callOrder.push(5);
      },
    };

    const plugin2: AppPlugin = {
      id: 'plugin-2',
      order: 1,
      init: async () => {
        callOrder.push(1);
      },
    };

    const plugin3: AppPlugin = {
      id: 'plugin-3',
      order: 10,
      init: async () => {
        callOrder.push(10);
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PluginRegistry,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: APP_PLUGINS, useValue: plugin1, multi: true },
        { provide: APP_PLUGINS, useValue: plugin2, multi: true },
        { provide: APP_PLUGINS, useValue: plugin3, multi: true },
      ],
    });

    registry = TestBed.inject(PluginRegistry);

    await registry.initAll();

    expect(callOrder).toEqual([1, 5, 10]);
  });

  it('should catch errors without halting sequential loop', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    const pluginFailure: AppPlugin = {
      id: 'failing-plugin',
      init: async () => {
        throw new Error('Crash!');
      },
    };

    const pluginSuccess: AppPlugin = {
      id: 'success-plugin',
      init: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PluginRegistry,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: APP_PLUGINS, useValue: pluginFailure, multi: true },
        { provide: APP_PLUGINS, useValue: pluginSuccess, multi: true },
      ],
    });

    registry = TestBed.inject(PluginRegistry);

    await registry.initAll();

    expect(consoleSpy).toHaveBeenCalled();
    expect(pluginSuccess.init).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should work gracefully when no plugins are provided', async () => {
    TestBed.configureTestingModule({
      providers: [PluginRegistry, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    registry = TestBed.inject(PluginRegistry);

    // Should just execute peacefully without errors.
    await expect(registry.initAll()).resolves.toBeUndefined();
  });
});
