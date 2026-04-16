import { TestBed } from '@angular/core/testing';
import { RouterStateSnapshot } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TemplatePageTitleStrategy } from './title.strategy';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
    expect(titleService.setTitle).toHaveBeenCalledWith('Test Page | Delisha Marie');
  });

  it('should set default title when title is undefined', () => {
    const mockSnapshot = {} as RouterStateSnapshot;
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);
    strategy.updateTitle(mockSnapshot);
    expect(titleService.setTitle).toHaveBeenCalledWith('From my table to yours | Delisha Marie');
  });
});
