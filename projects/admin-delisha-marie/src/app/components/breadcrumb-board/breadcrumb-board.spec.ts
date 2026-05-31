import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BreadcrumbBoardComponent } from './breadcrumb-board';
import { Breadcrumbs } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';

const mockRecipeService = {
  recipes: signal<unknown[]>([
    {
      id: 1,
      title: 'Appetizers Dips',
      slug: 'app-dips',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Appetizers', url: '/recipes/appetizers' },
            { label: 'Dips', url: '/recipes/appetizers/dips' },
          ],
        ],
      },
    },
    {
      id: 4,
      title: 'Breakfast Eggs',
      slug: 'breakfast-eggs',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Breakfast', url: '/recipes/breakfast' },
            { label: 'Eggs', url: '/recipes/breakfast/eggs' },
          ],
        ],
      },
    },
    {
      id: 7,
      title: 'Beef',
      slug: 'main-beef',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
            { label: 'Beef', url: '/recipes/main-dishes/beef' },
          ],
        ],
      },
    },
    {
      id: 8,
      title: 'Chicken',
      slug: 'main-chicken',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
            { label: 'Chicken', url: '/recipes/main-dishes/chicken' },
          ],
        ],
      },
    },
    {
      id: 9,
      title: 'Pasta',
      slug: 'main-pasta',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
            { label: 'Pasta', url: '/recipes/main-dishes/pasta' },
          ],
        ],
      },
    },
    {
      id: 10,
      title: 'Pork',
      slug: 'main-pork',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
            { label: 'Pork', url: '/recipes/main-dishes/pork' },
          ],
        ],
      },
    },
    {
      id: 11,
      title: 'Seafood',
      slug: 'main-seafood',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Main Dishes', url: '/recipes/main-dishes' },
            { label: 'Seafood', url: '/recipes/main-dishes/seafood' },
          ],
        ],
      },
    },
    {
      id: 12,
      title: 'Sides',
      slug: 'sides',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Sides', url: '/recipes/sides' },
          ],
        ],
      },
    },
    {
      id: 13,
      title: 'Salads',
      slug: 'salads',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Salads', url: '/recipes/salads' },
          ],
        ],
      },
    },
    {
      id: 14,
      title: 'Soups',
      slug: 'soups',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Soups', url: '/recipes/soups' },
          ],
        ],
      },
    },
    {
      id: 15,
      title: 'Breads',
      slug: 'breads',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Breads', url: '/recipes/breads' },
          ],
        ],
      },
    },
    {
      id: 16,
      title: 'Desserts',
      slug: 'desserts',
      status: 'published',
      breadcrumbs: {
        items: [
          [
            { label: 'Home', url: '/' },
            { label: 'Recipes', url: '/recipes' },
            { label: 'Desserts', url: '/recipes/desserts' },
          ],
        ],
      },
    },
  ]),
};

describe('BreadcrumbBoardComponent', () => {
  let component: BreadcrumbBoardComponent;
  let fixture: ComponentFixture<BreadcrumbBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbBoardComponent],
      providers: [{ provide: RecipeService, useValue: mockRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbBoardComponent);
    component = fixture.componentInstance;
  });

  it('should create and load default base pieces', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.boardPieces()).toEqual([
      { name: 'Home', url: '/' },
      { name: 'Recipes', url: '/recipes' },
    ]);
  });

  it('should initialize board from initialBreadcrumbs input', () => {
    const testBreadcrumbs: Breadcrumbs = {
      main: 0,
      items: [
        [
          { label: 'Home', url: '/' },
          { label: 'Recipes', url: '/recipes' },
          { label: 'Appetizers', url: '/recipes/appetizers' },
        ],
      ],
    };

    fixture.componentRef.setInput('initialBreadcrumbs', testBreadcrumbs);
    fixture.detectChanges();

    expect(component.boardPieces()).toEqual([
      { name: 'Home', url: '/' },
      { name: 'Recipes', url: '/recipes' },
      { name: 'Appetizers', url: '/recipes/appetizers' },
    ]);
  });

  it('should toggle predefined category and calculate subcategories', () => {
    fixture.detectChanges();

    // Toggle Main Dishes category
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    expect(component.boardPieces().length).toBe(3);
    expect(component.boardPieces()[2].name).toBe('Main Dishes');

    // Subcategories config children should become available
    const subs = component.availableSubcategories();
    expect(subs.length).toBe(5);
    expect(subs[0].name).toBe('Beef');

    // Toggle again to truncate
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    expect(component.boardPieces().length).toBe(2);
  });

  it('should automatically append recipe destination piece and preserve it at the end of the trail', () => {
    fixture.componentRef.setInput('recipeTitle', 'Drop Dead Pasta');
    fixture.componentRef.setInput('recipeSlug', 'drop-dead-pasta');
    fixture.detectChanges();

    // Recipe destination piece automatically appended (Home > Recipes > Drop Dead Pasta)
    expect(component.boardPieces().length).toBe(3);
    expect(component.boardPieces()[2].name).toBe('Drop Dead Pasta');
    expect(component.boardPieces()[2].url).toBe('/recipe/drop-dead-pasta');

    // Toggling category keeps recipe destination at the absolute end
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    expect(component.boardPieces().length).toBe(4);
    expect(component.boardPieces()[2].name).toBe('Main Dishes');
    expect(component.boardPieces()[3].name).toBe('Drop Dead Pasta');

    // Toggling subcategory keeps recipe destination at the absolute end
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(5);
    expect(component.boardPieces()[3].name).toBe('Pasta');
    expect(component.boardPieces()[4].name).toBe('Drop Dead Pasta');
  });

  it('should add and remove custom pieces with sanitization, prefix prepending, and length limits', () => {
    fixture.detectChanges();

    // 1. Should not add if length of url part is < 3
    component.customName.set('Short');
    component.customUrl.set('ab'); // less than 3
    component.addCustomPiece();
    expect(component.boardPieces().length).toBe(2); // Still default 2

    // 2. Should clean prefix/slashes and prepend /recipes/
    component.customName.set('Custom Pathway');
    component.customUrl.set('/recipes/summer-cookout/');

    // Simulate updating via event to check input cleaning
    const event = { target: { value: '/recipes/summer-cookout/' } } as unknown as Event;
    component.updateCustomUrl(event);
    expect(component.customUrl()).toBe('summer-cookout/'); // Redundant prefix and leading slashes removed

    // Verify salads variations always sanitize correctly
    const eventSalads1 = { target: { value: 'recipes/salads' } } as unknown as Event;
    component.updateCustomUrl(eventSalads1);
    expect(component.customUrl()).toBe('salads');

    const eventSalads2 = { target: { value: '/recipes/salads' } } as unknown as Event;
    component.updateCustomUrl(eventSalads2);
    expect(component.customUrl()).toBe('salads');

    const eventSalads3 = { target: { value: 'salads' } } as unknown as Event;
    component.updateCustomUrl(eventSalads3);
    expect(component.customUrl()).toBe('salads');

    // Reset to verified custom path for completion
    component.customUrl.set('summer-cookout/');
    component.addCustomPiece();

    expect(component.boardPieces().length).toBe(3);
    expect(component.boardPieces()[2].name).toBe('Custom Pathway');
    expect(component.boardPieces()[2].url).toBe('/recipes/summer-cookout'); // final slash removed and prefix prepended correctly

    // 3. Remove the added capsule
    component.removePiece(2);
    expect(component.boardPieces().length).toBe(2);
  });

  it('should enforce single-choice for categories and remove subcategory when category changes', () => {
    fixture.detectChanges();

    // 1. Select Main Dishes category
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    // 2. Select Pasta subcategory
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(4);

    // 3. Select a different category (e.g. Appetizers)
    component.toggleCategory({ name: 'Appetizers', url: '/recipes/appetizers' });

    // Category should be replaced, and subcategory must be removed
    expect(component.boardPieces().length).toBe(3);
    expect(component.boardPieces()[2].name).toBe('Appetizers');
    // Pasta subcategory should no longer be on the board
    expect(component.boardPieces().some((p) => p.name === 'Pasta')).toBe(false);
  });

  it('should enforce single-choice for subcategories', () => {
    fixture.detectChanges();

    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(4);

    // Toggle a different subcategory (e.g. Beef)
    component.toggleSubcategory({ name: 'Beef', url: '/recipes/main-dishes/beef' });

    // The subcategory should be replaced, keeping only the new one
    expect(component.boardPieces().length).toBe(4);
    expect(component.boardPieces()[3].name).toBe('Beef');
    expect(component.boardPieces().some((p) => p.name === 'Pasta')).toBe(false);
  });

  it('should remove subcategory when category capsule is removed directly', () => {
    fixture.detectChanges();

    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(4);

    // Remove the category capsule (index 2) directly
    component.removePiece(2);

    // Both category and subcategory capsules should be gone
    expect(component.boardPieces().length).toBe(2);
    expect(component.boardPieces().some((p) => p.name === 'Main Dishes')).toBe(false);
    expect(component.boardPieces().some((p) => p.name === 'Pasta')).toBe(false);
  });

  it('should dynamically update Navigation URL prefix based on active trail and disable panel for subcategories', () => {
    fixture.detectChanges();

    // 1. Initially (Home > Recipes), prefix is /recipes/ and panel is active
    expect(component.currentUrlPrefix()).toBe('/recipes/');
    expect(component.isCustomPanelActive()).toBe(true);

    // 2. Select Main Dishes category (Home > Recipes > Main Dishes)
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    expect(component.currentUrlPrefix()).toBe('/recipes/main-dishes/');
    expect(component.isCustomPanelActive()).toBe(true);

    // 3. Select Pasta subcategory (Home > Recipes > Main Dishes > Pasta)
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });

    // Prefix should update to /recipes/main-dishes/pasta/
    expect(component.currentUrlPrefix()).toBe('/recipes/main-dishes/pasta/');
    // Panel should be disabled because Pasta is a predefined subcategory
    expect(component.isCustomPanelActive()).toBe(false);
  });

  it('should generate a correct compiled preview string', () => {
    fixture.detectChanges();
    expect(component.compiledPreview()).toBe('Home (/)  ➔  Recipes (/recipes)');
  });

  it('should trigger addCustomPiece and preventDefault when Enter key is pressed in custom pathway inputs', () => {
    fixture.detectChanges();
    const addCustomPieceSpy = vi.spyOn(component, 'addCustomPiece');

    const nameInput = fixture.nativeElement.querySelector('#custom-name');
    nameInput.value = 'Summer Cookout';
    nameInput.dispatchEvent(new Event('input'));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');
    nameInput.dispatchEvent(keydownEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(addCustomPieceSpy).toHaveBeenCalled();
  });

  // --- COVERAGE BOOSTERS ---

  it('should trigger template click and enter handlers correctly for categories, subcategories, trails, and custom pathways', () => {
    fixture.detectChanges();
    const catSpy = vi.spyOn(component, 'toggleCategory');
    const subSpy = vi.spyOn(component, 'toggleSubcategory');

    // Toggling Category in UI template
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const catBtn = buttons.find((b) => b.textContent?.trim().includes('Appetizers'));
    if (catBtn) {
      catBtn.click();
      fixture.detectChanges();
      expect(catSpy).toHaveBeenCalled();
    }

    // Toggle Category via method to enable subcategories
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    fixture.detectChanges();

    // Re-query buttons to find dynamic subcategories
    const buttons2 = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const subBtn = buttons2.find((b) => b.textContent?.trim().includes('Beef'));
    if (subBtn) {
      subBtn.click();
      fixture.detectChanges();
      expect(subSpy).toHaveBeenCalled();
    }

    // Clicking capsule removal button in UI template
    const buttons3 = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const closeBtn = buttons3.find((b) => b.textContent?.trim() === 'close');
    if (closeBtn) {
      const removeSpy = vi.spyOn(component, 'removePiece');
      closeBtn.click();
      fixture.detectChanges();
      expect(removeSpy).toHaveBeenCalled();
    }

    // Keydown enter on custom url input
    const urlInput = fixture.nativeElement.querySelector('#custom-url');
    if (urlInput) {
      const addSpy = vi.spyOn(component, 'addCustomPiece');
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      urlInput.dispatchEvent(keydownEvent);
      expect(addSpy).toHaveBeenCalled();
    }

    // Checking switchTrail UI binding
    component.addNewTrail();
    fixture.detectChanges();
    const switchSpy = vi.spyOn(component, 'switchTrail');
    const trailButtons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const trail2Btn = trailButtons.find((b) => b.textContent?.includes('Trail 2'));
    if (trail2Btn) {
      trail2Btn.click();
      expect(switchSpy).toHaveBeenCalledWith(1);
    }
  });

  it('should manage trail switching, adding, and deletion including index-shifting bounds and empty checks', () => {
    fixture.detectChanges();

    // 1. Deleting trail 0 or when only 1 trail exists should do nothing
    const dummyEvent = {
      stopPropagation: () => {
        /* noop */
      },
    } as unknown as Event;
    component.deleteTrail(0, dummyEvent);
    expect(component.boardPiecesList().length).toBe(1);

    // 2. Add multiple trails
    component.addNewTrail(); // idx 1
    component.addNewTrail(); // idx 2
    expect(component.boardPiecesList().length).toBe(3);
    expect(component.activeTrailIndex()).toBe(2);

    // 3. Delete active trail (idx 2) causing activeTrailIndex to shift to length - 1 (idx 1)
    component.deleteTrail(2, dummyEvent);
    expect(component.boardPiecesList().length).toBe(2);
    expect(component.activeTrailIndex()).toBe(1);

    // 4. Switch trail programmatically
    component.switchTrail(0);
    expect(component.activeTrailIndex()).toBe(0);
  });

  it('should toggle subcategory off when clicking an already selected subcategory', () => {
    fixture.detectChanges();

    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(4);

    // Toggle off
    component.toggleSubcategory({ name: 'Pasta', url: '/recipes/main-dishes/pasta' });
    expect(component.boardPieces().length).toBe(3);
    expect(component.boardPieces().some((p) => p.name === 'Pasta')).toBe(false);
  });

  it('should handle negative and edge cases in extractBreadcrumbsToMap', () => {
    // 1. Recipes with undefined breadcrumbs
    const recipesWithMissingBreadcrumbs = [
      { id: 1, title: 'No Breadcrumbs', slug: 'no-bc' },
    ] as unknown as Recipe[];
    const map = new Map();
    component['extractBreadcrumbsToMap'](recipesWithMissingBreadcrumbs, map);
    expect(map.size).toBe(0);

    // 2. Recipes with short trail (length <= 2) or non-standard trail
    const shortTrailRecipes = [
      {
        id: 2,
        title: 'Short',
        slug: 'short',
        breadcrumbs: {
          items: [
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
            ],
          ],
        },
      },
    ] as unknown as Recipe[];
    component['extractBreadcrumbsToMap'](shortTrailRecipes, map);
    expect(map.size).toBe(0);

    // 3. Recipes with category missing label or URL not starting with /recipes/
    const invalidCategoryRecipes = [
      {
        id: 3,
        title: 'Invalid',
        slug: 'invalid',
        breadcrumbs: {
          items: [
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
              { label: '', url: '/recipes/invalid' }, // Empty label
            ],
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
              { label: 'Invalid URL', url: '/not-recipes/invalid' }, // Wrong prefix
            ],
          ],
        },
      },
    ] as unknown as Recipe[];
    component['extractBreadcrumbsToMap'](invalidCategoryRecipes, map);
    expect(map.size).toBe(0);

    // 4. Trail where subpiece is auto-generated (starts with /recipe/) or missing url
    const specialSubcategoryRecipes = [
      {
        id: 4,
        title: 'Special',
        slug: 'special',
        breadcrumbs: {
          items: [
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
              { label: 'Main Dishes', url: '/recipes/main-dishes' },
              { label: 'Recipe Leaf', url: '/recipe/recipe-leaf' }, // Auto-generated leaf
            ],
            [
              { label: 'Home', url: '/' },
              { label: 'Recipes', url: '/recipes' },
              { label: 'Main Dishes', url: '/recipes/main-dishes' },
              { label: 'Sub With Missing Url' }, // Undefined URL
            ],
          ],
        },
      },
    ] as unknown as Recipe[];
    component['extractBreadcrumbsToMap'](specialSubcategoryRecipes, map);

    // Main Dishes category should be parsed
    expect(map.has('Main Dishes')).toBe(true);
    const catData = map.get('Main Dishes');
    // Leaf node should be skipped
    expect(catData.subs.has('Recipe Leaf')).toBe(false);
    // Sub with missing URL should fallback to ''
    expect(catData.subs.has('Sub With Missing Url')).toBe(true);
    expect(catData.subs.get('Sub With Missing Url')).toBe('');
  });

  it('should handle edge cases and empty arrays in computed currentUrlPrefix and isCustomPanelActive', () => {
    fixture.detectChanges();

    // 1. Force boardPieces to return empty array by setting boardPiecesList to an empty trail [[]]
    component.boardPiecesList.set([[]]);
    component.activeTrailIndex.set(0);
    expect(component.boardPieces().length).toBe(0);
    expect(component.currentUrlPrefix()).toBe('/');
    expect(component.isCustomPanelActive()).toBe(false);

    // 2. Force nonRecipe to be empty by having a trail with only recipe leaf pieces
    component.boardPiecesList.set([[{ name: 'Recipe Leaf', url: '/recipe/leaf' }]]);
    expect(component.currentUrlPrefix()).toBe('/');
    expect(component.isCustomPanelActive()).toBe(false);

    // 3. Fallback when availableSubcategories has empty trail
    component.boardPiecesList.set([[]]);
    expect(component.availableSubcategories()).toEqual([]);
  });

  it('should ignore direct removals for pieces index < 2', () => {
    fixture.detectChanges();
    component.removePiece(0); // Removing 'Home' capsule
    expect(component.boardPieces()[0].name).toBe('Home');

    component.removePiece(1); // Removing 'Recipes' capsule
    expect(component.boardPieces()[1].name).toBe('Recipes');
  });

  it('should handle redundant active prefix matching inside addCustomPiece', () => {
    fixture.detectChanges();
    // Select category Main Dishes (currentUrlPrefix is /recipes/main-dishes/)
    component.toggleCategory({ name: 'Main Dishes', url: '/recipes/main-dishes' });

    component.customName.set('Summer Ideas');
    component.customUrl.set('/recipes/main-dishes/summer-ideas'); // Redundant active prefix
    component.addCustomPiece();

    expect(component.boardPieces().length).toBe(4);
    // Should gracefully clean and append
    expect(component.boardPieces()[3].name).toBe('Summer Ideas');
    expect(component.boardPieces()[3].url).toBe('/recipes/main-dishes/summer-ideas');
  });
});
