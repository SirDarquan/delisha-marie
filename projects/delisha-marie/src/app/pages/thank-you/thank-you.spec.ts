import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThankYouPage } from './thank-you';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PagesService, Page } from '../../services/pages.service';
import { BehaviorSubject } from 'rxjs';
import { IMAGE_LOADER } from '@angular/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RecipeService } from '../../services/recipe.service';

describe('ThankYouPage', () => {
  let component: ThankYouPage;
  let fixture: ComponentFixture<ThankYouPage>;
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ThankYouPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: new BehaviorSubject({}),
          },
        },
        { provide: PagesService, useValue: mockPagesService },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
        { provide: RecipeService, useValue: { getFavoriteRecipes: vi.fn().mockResolvedValue([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThankYouPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load thank-you page content', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'Thank You',
      slug: 'thank-you',
      content: '<p>Thank You Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('thank-you');
    expect(component['page']()).toEqual(mockPage);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();
    expect(compiled.querySelector('.story')).toBeTruthy();
    expect(compiled.innerHTML).toContain('Thank You Content');
  });

  it('should handle error when page load fails', async () => {
    mockPagesService['getPage'].mockRejectedValue(new Error('Load Failed'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['page']()).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.story')).toBeNull();
  });

  it('should correctly expose loading state', async () => {
    mockPagesService['getPage'].mockReturnValue(new Promise(() => undefined)); // Never resolves
    fixture.detectChanges();

    expect(component['loading']()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });
});
