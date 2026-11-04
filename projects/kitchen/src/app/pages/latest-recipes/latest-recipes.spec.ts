import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeService } from '../../services/recipe.service';
import { LatestRecipesPage } from './latest-recipes';

describe('LatestRecipesPage', () => {
  let component: LatestRecipesPage;
  let fixture: ComponentFixture<LatestRecipesPage>;

  const createComponent = async (params: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [LatestRecipesPage],
      providers: [
        provideRouter([]),
        {
          provide: RecipeService,
          useValue: { getRecipes: vi.fn().mockResolvedValue({ items: [], total: 0 }) },
        },
        { provide: ActivatedRoute, useValue: { params: of(params) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LatestRecipesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the page component', async () => {
    await createComponent({ page: '1' });
    expect(component).toBeTruthy();
  });

  it('should render the colored header with "Latest Recipes"', async () => {
    await createComponent({ page: '1' });
    const header = fixture.nativeElement.querySelector('dm-colored-header');
    expect(header).toBeTruthy();
    expect(header.getAttribute('title')).toBe('Latest Recipes');
  });

  it('should generate breadcrumbs for page 1 without page label', async () => {
    await createComponent({ page: '1' });
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0]).toEqual({ label: 'Home', url: '/' });
    expect(breadcrumbs[1]).toEqual({ label: 'Latest Recipes', url: undefined });
  });

  it('should generate breadcrumbs for page > 1 with Page :page label', async () => {
    await createComponent({ page: '3' });
    const breadcrumbs = component.breadcrumbItems();
    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({ label: 'Home', url: '/' });
    expect(breadcrumbs[1]).toEqual({ label: 'Latest Recipes', url: '/' });
    expect(breadcrumbs[2]).toEqual({ label: 'Page 3' });
  });

  it('should handle non-numeric or missing page param by defaulting to page 1', async () => {
    await createComponent({ page: 'invalid' });
    expect(component.currentPage()).toBe(1);
  });
});
