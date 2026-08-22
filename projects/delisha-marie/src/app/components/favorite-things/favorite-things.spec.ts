import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoriteThings } from './favorite-things';
import { RecipeService } from '../../services/recipe.service';
import { ActivatedRoute } from '@angular/router';

describe('FavoriteThings', () => {
  let component: FavoriteThings;
  let fixture: ComponentFixture<FavoriteThings>;
  let mockRecipeService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    mockRecipeService = {
      getFavoriteRecipes: vi.fn().mockResolvedValue({ items: [] }),
    };

    await TestBed.configureTestingModule({
      imports: [FavoriteThings],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoriteThings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render favorite recipes', async () => {
    mockRecipeService['getFavoriteRecipes'].mockResolvedValue({
      items: [
        { title: 'Recipe 1', slug: 'recipe-1', image: 'image1.jpg' },
        { title: 'Recipe 2', slug: 'recipe-2', image: 'image2.jpg' },
      ],
    });

    // Re-create to trigger resource loader
    fixture = TestBed.createComponent(FavoriteThings);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Need to wait for resource to resolve
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My favorite things!');
    expect(compiled.textContent).toContain('Recipe 1');
    expect(compiled.textContent).toContain('Recipe 2');
  });
});
