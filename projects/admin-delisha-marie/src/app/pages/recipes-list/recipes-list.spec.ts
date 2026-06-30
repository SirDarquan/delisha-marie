import { ScrollingModule } from '@angular/cdk/scrolling';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipesListComponent } from './recipes-list';

describe('RecipesListComponent', () => {
  let component: RecipesListComponent;
  let fixture: ComponentFixture<RecipesListComponent>;

  let mockRecipesData: Recipe[] = [];
  let deletedId: string | number | null = null;

  const fakeRecipeService = {
    fetchRecipes: vi.fn().mockResolvedValue(mockRecipesData),
    getCachedRecipesList: () => [] as Recipe[],
    deleteRecipe: (id: string | number) => {
      deletedId = id;
      return Promise.resolve({ success: true });
    },
    getLastActiveRecipeId: () => null as number | string | null,
    getLastScrollOffset: () => 0,
    setLastActiveRecipeId: vi.fn(),
    setLastScrollOffset: vi.fn(),
    setCachedRecipesList: vi.fn(),
  };

  Element.prototype.scrollTo = vi.fn();

  beforeEach(async () => {
    deletedId = null;
    mockRecipesData = [
      {
        id: 1,
        title: 'Pasta',
        slug: 'pasta',
        description: 'Tasty',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: '',
        prepTime: '',
        cookTime: '',
        difficulty: 'Easy',
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        status: 'published',
      },
      {
        id: 2,
        title: 'Pizza',
        slug: 'pizza',
        description: 'Delicious',
        content: 'Sample',
        ingredients: [],
        instructions: [],
        image: '',
        prepTime: '',
        cookTime: '',
        difficulty: 'Easy',
        totalTime: '',
        yield: '',
        author: 'Delisha Marie',
        status: 'published',
      },
    ];

    await TestBed.configureTestingModule({
      imports: [RecipesListComponent, ScrollingModule],
      providers: [provideRouter([]), { provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(RecipesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should debounce search and fetch new recipes', async () => {
    // Reset call count because it's called on init
    fakeRecipeService.fetchRecipes.mockClear();

    component.onSearchChange({ target: { value: 'pasta' } } as unknown as Event);
    await new Promise((r) => setTimeout(r, 150));
    expect(fakeRecipeService.fetchRecipes).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 600));
    expect(fakeRecipeService.fetchRecipes).toHaveBeenCalledWith(0, 50, 'pasta');
  });

  it('should not delete recipe if confirm is false', () => {
    const originalConfirm = window.confirm;
    window.confirm = () => false;

    component.onDelete(1);
    expect(deletedId).toBeNull();

    window.confirm = originalConfirm;
  });

  it('should delete recipe if confirm is true', async () => {
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    await component.onDelete(1);
    expect(deletedId).toBe(1);

    window.confirm = originalConfirm;
  });

  it('should render no results message when search returns empty', async () => {
    fakeRecipeService.fetchRecipes.mockResolvedValueOnce([]);
    component.onSearchChange({ target: { value: 'nonexistent' } } as unknown as Event);
    await new Promise((r) => setTimeout(r, 600)); // debounceTime is 500
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 100)); // wait for fetch
    fixture.detectChanges();

    const emptyMessage = fixture.nativeElement.querySelector('.p-8.text-center');
    expect(emptyMessage.textContent).toContain('No recipes found');
  });

  it('should render image when provided in recipe object', async () => {
    mockRecipesData[0].image = 'https://example.com/pasta.jpg';
    fakeRecipeService.getCachedRecipesList = () => mockRecipesData;

    // Recreate fixture to reload resource
    fixture = TestBed.createComponent(RecipesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['recipes']()[0].image).toContain('pasta.jpg');

    // reset
    fakeRecipeService.getCachedRecipesList = () => [];
  });

  it('should fallback difficulty to Easy if not provided', async () => {
    mockRecipesData[0].difficulty = '';
    fakeRecipeService.getCachedRecipesList = () => mockRecipesData;

    fixture = TestBed.createComponent(RecipesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['recipes']()[0].difficulty).toBe('');

    // reset
    fakeRecipeService.getCachedRecipesList = () => [];
  });

  describe('fetchNextBatch', () => {
    it('should not fetch if already loading', async () => {
      component['isLoading'].set(true);
      fakeRecipeService.fetchRecipes.mockClear();
      await component.fetchNextBatch();
      expect(fakeRecipeService.fetchRecipes).not.toHaveBeenCalled();
    });

    it('should not fetch if no more items', async () => {
      component['hasMore'] = false;
      fakeRecipeService.fetchRecipes.mockClear();
      await component.fetchNextBatch();
      expect(fakeRecipeService.fetchRecipes).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      component['hasMore'] = true;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
      fakeRecipeService.fetchRecipes.mockRejectedValueOnce(new Error('Network Error'));

      await component.fetchNextBatch();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load recipes', expect.any(Error));
      expect(component['isLoading']()).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('onScroll', () => {
    it('should trigger fetchNextBatch if scrolled near the end', () => {
      const fetchSpy = vi.spyOn(component, 'fetchNextBatch');
      // Mock viewport
      vi.spyOn(
        component.viewport() as unknown as Record<string, unknown>,
        'getRenderedRange',
      ).mockReturnValue({
        start: 0,
        end: 45,
      });
      component['recipes'].set(Array(50).fill({}) as never);

      component.onScroll(45);

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should not trigger fetchNextBatch if not near the end', () => {
      const fetchSpy = vi.spyOn(component, 'fetchNextBatch');
      vi.spyOn(
        component.viewport() as unknown as Record<string, unknown>,
        'getRenderedRange',
      ).mockReturnValue({
        start: 0,
        end: 10,
      });
      component['recipes'].set(Array(50).fill({}) as never);

      component.onScroll(10);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it('should track by recipe id', () => {
    expect(component.trackByRecipeId(0, { id: 42 })).toBe(42);
  });

  describe('ngAfterViewInit', () => {
    it('should restore last active recipe id', async () => {
      const scrollSpy = vi
        .spyOn(component.viewport() as unknown as Record<string, unknown>, 'scrollToIndex')
        .mockImplementation(vi.fn());
      vi.spyOn(fakeRecipeService, 'getLastActiveRecipeId').mockReturnValue(2);

      component['recipes'].set(mockRecipesData);
      component.ngAfterViewInit();
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 300)); // Increased wait time for flakiness

      expect(scrollSpy).toHaveBeenCalledWith(1, 'smooth');
      expect(component['highlightedRecipeId']()).toBe(2);
    });

    it('should restore scroll offset if no active id', async () => {
      const scrollSpy = vi
        .spyOn(component.viewport() as unknown as Record<string, unknown>, 'scrollToOffset')
        .mockImplementation(vi.fn());
      vi.spyOn(fakeRecipeService, 'getLastActiveRecipeId').mockReturnValue(null);
      vi.spyOn(fakeRecipeService, 'getLastScrollOffset').mockReturnValue(150);

      component.ngAfterViewInit();

      await new Promise((r) => setTimeout(r, 100));

      expect(scrollSpy).toHaveBeenCalledWith(150);
    });
  });

  describe('ngOnDestroy', () => {
    it('should save scroll offset and cached list', () => {
      vi.spyOn(
        component.viewport() as unknown as Record<string, unknown>,
        'measureScrollOffset',
      ).mockReturnValue(300);
      const setOffsetSpy = vi.spyOn(fakeRecipeService, 'setLastScrollOffset');
      const setCacheSpy = vi.spyOn(fakeRecipeService, 'setCachedRecipesList');

      component['recipes'].set(mockRecipesData);
      component.ngOnDestroy();

      expect(setOffsetSpy).toHaveBeenCalledWith(300);
      expect(setCacheSpy).toHaveBeenCalledWith(mockRecipesData);
    });
  });

  it('should set last active recipe', () => {
    const spy = vi.spyOn(fakeRecipeService, 'setLastActiveRecipeId');
    component.setLastActiveRecipe(123);
    expect(spy).toHaveBeenCalledWith(123);
  });
});
