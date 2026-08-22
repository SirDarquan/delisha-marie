import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThankYouPage } from './thank-you';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PagesService } from '../../services/pages.service';
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

  it('should render page layout', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-page-layout')).toBeTruthy();
  });
});
