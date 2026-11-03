import { ClassProvider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplatePageTitleStrategy, provideTitleStrategy } from './title.strategy';

describe('TemplatePageTitleStrategy', () => {
  let strategy: TemplatePageTitleStrategy;
  let titleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TemplatePageTitleStrategy, { provide: Title, useValue: { setTitle: vi.fn() } }],
    });
    strategy = TestBed.inject(TemplatePageTitleStrategy);
    titleService = TestBed.inject(Title);
  });

  it('should set title with suffix when title is defined', () => {
    const mockSnapshot = {} as RouterStateSnapshot;
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Test Page');
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith("Test Page | Delisha Marie's Kitchen");
  });

  it('should set default title when title is undefined', () => {
    const mockSnapshot = {} as RouterStateSnapshot;
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith(
      "From my table to yours | Delisha Marie's Kitchen",
    );
  });

  it('should set default title when title is an empty string', () => {
    const mockSnapshot = {} as RouterStateSnapshot;
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('');
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith(
      "From my table to yours | Delisha Marie's Kitchen",
    );
  });

  it('should update the title multiple times', () => {
    const mockSnapshot = {} as RouterStateSnapshot;
    const buildTitleSpy = vi.spyOn(strategy, 'buildTitle');

    buildTitleSpy.mockReturnValue('Page 1');
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith("Page 1 | Delisha Marie's Kitchen");

    buildTitleSpy.mockReturnValue('Page 2');
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith("Page 2 | Delisha Marie's Kitchen");
  });

  it('should be injectable via TitleStrategy token when provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Title, useValue: { setTitle: vi.fn() } },
        { provide: TemplatePageTitleStrategy, useClass: TemplatePageTitleStrategy },
      ],
    });
    const injected = TestBed.inject(TemplatePageTitleStrategy);
    expect(injected).toBeInstanceOf(TemplatePageTitleStrategy);
  });

  it('should have a provider helper that returns the correct provider configuration', () => {
    const provider = provideTitleStrategy(TemplatePageTitleStrategy) as ClassProvider;
    expect(provider.provide).toBe(TitleStrategy);
    expect(provider.useClass).toBe(TemplatePageTitleStrategy as Type<TemplatePageTitleStrategy>);
  });
});
