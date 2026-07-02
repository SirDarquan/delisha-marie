import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryTrails } from '@dm/library';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { CategoryBoardComponent } from './category-board';

describe('CategoryBoardComponent', () => {
  let component: CategoryBoardComponent;
  let fixture: ComponentFixture<CategoryBoardComponent>;

  let mockRecipesData: Recipe[] = [
    {
      id: 1,
      title: 'Recipe 1',
      slug: 'recipe-1',
      category: {
        trails: [
          [
            { name: 'Home', url: '/' },
            { name: 'Recipes', url: '/recipes' },
            { name: 'Dinner', url: '/recipes/dinner' },
            { name: 'Chicken', url: '/recipes/dinner/chicken' },
          ],
        ],
      },
    } as unknown as Recipe,
    {
      id: 2,
      title: 'Recipe 2',
      slug: 'recipe-2',
      category: {
        trails: [
          [
            { name: 'Home', url: '/' },
            { name: 'Recipes', url: '/recipes' },
            { name: 'Dessert', url: '/recipes/dessert' },
          ],
        ],
      },
    } as unknown as Recipe,
  ];

  const fakeRecipeService = {
    fetchRecipes: () => Promise.resolve(mockRecipesData),
  };

  beforeEach(async () => {
    mockRecipesData = [
      {
        id: 1,
        title: 'Recipe 1',
        slug: 'recipe-1',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
              { name: 'Chicken', url: '/recipes/dinner/chicken' },
            ],
          ],
        },
      } as unknown as Recipe,
      {
        id: 2,
        title: 'Recipe 2',
        slug: 'recipe-2',
        category: {
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dessert', url: '/recipes/dessert' },
            ],
          ],
        },
      } as unknown as Recipe,
    ];
    await TestBed.configureTestingModule({
      imports: [CategoryBoardComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBoardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  describe('Fallback behaviors without category map', () => {
    beforeEach(async () => {
      mockRecipesData = [];
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CategoryBoardComponent],
        providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
      }).compileComponents();

      fixture = TestBed.createComponent(CategoryBoardComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should fallback to baseline configuration if recipe service provides no categories', () => {
      expect(component).toBeTruthy();

      const previewVal = component.compiledPreview();
      // Default trail starts with Home and Recipes
      expect(previewVal).toContain('Home (/)');
      expect(previewVal).toContain('Recipes (/recipes)');
    });
  });

  it('should create and render base board pieces', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component).toBeTruthy();

    const previewVal = component.compiledPreview();
    // Default trail starts with Home and Recipes
    expect(previewVal).toContain('Home (/)');
    expect(previewVal).toContain('Recipes (/recipes)');
  });

  it('should compile predefined categories from recipes', () => {
    fixture.detectChanges();
    const categories = component.categories();
    expect(categories.length).toBe(2);
    expect(categories[0].name).toBe('Dessert');
    expect(categories[1].name).toBe('Dinner');
    expect(categories[1].children?.length).toBe(1);
    expect(categories[1].children?.[0].name).toBe('Chicken');
  });

  it('should toggle a predefined category on and off', () => {
    fixture.detectChanges();
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;

    // Toggle on
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();
    expect(component.isPieceSelected(dinnerCat.url)).toBe(true);
    expect(component.compiledPreview()).toContain('Dinner (/recipes/dinner)');

    // Toggle off
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();
    expect(component.isPieceSelected(dinnerCat.url)).toBe(false);
  });

  it('should toggle a predefined subcategory on and off', () => {
    fixture.detectChanges();
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
    const chickenSub = dinnerCat.children![0];

    // Select category first
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();

    // Toggle subcategory on
    component.toggleSubcategory(chickenSub);
    fixture.detectChanges();
    expect(component.isPieceSelected(chickenSub.url)).toBe(true);
    expect(component.compiledPreview()).toContain('Chicken (/recipes/dinner/chicken)');

    // Toggle subcategory off
    component.toggleSubcategory(chickenSub);
    fixture.detectChanges();
    expect(component.isPieceSelected(chickenSub.url)).toBe(false);
  });

  it('should support adding and switching between multiple trails', () => {
    fixture.detectChanges();
    expect(component.boardPiecesList().length).toBe(1);

    component.addNewTrail();
    fixture.detectChanges();
    expect(component.boardPiecesList().length).toBe(2);
    expect(component.activeTrailIndex()).toBe(1);

    component.switchTrail(0);
    expect(component.activeTrailIndex()).toBe(0);
  });

  it('should support deleting a trail', () => {
    fixture.detectChanges();
    component.addNewTrail(); // List length = 2, active index = 1
    fixture.detectChanges();

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as Event;

    component.deleteTrail(1, mockEvent);
    fixture.detectChanges();
    expect(component.boardPiecesList().length).toBe(1);
    expect(component.activeTrailIndex()).toBe(0);
  });

  it('should add a custom pathway piece and clean redundancy', () => {
    fixture.detectChanges();
    // Preselect Dinner category so prefix is /recipes/dinner/
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();

    component.customName.set('Spicy');
    component.customUrl.set('/recipes/dinner/spicy'); // redundant prefix
    component.addCustomPiece();
    fixture.detectChanges();

    expect(component.compiledPreview()).toContain('Spicy (/recipes/dinner/spicy)');
  });

  it('should set component control value to null if no category segment has been selected', () => {
    fixture.detectChanges();
    // Initially, board only contains Home and Recipes (length 2)
    expect(component.value()).toBeNull();

    // Select Dinner category
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();

    expect(component.value()).not.toBeNull();
    expect((component.value() as CategoryTrails).trails[0].length).toBe(3);
  });

  it('should load initial values through constructor effect', async () => {
    const value: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Dinner', url: '/recipes/dinner' },
        ],
      ],
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CategoryBoardComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    const customFixture = TestBed.createComponent(CategoryBoardComponent);
    customFixture.componentRef.setInput('value', value);
    customFixture.detectChanges();

    // Give effect time to run
    await new Promise((resolve) => setTimeout(resolve, 0));
    customFixture.detectChanges();

    expect(customFixture.componentInstance.boardPieces().length).toBe(3);
    expect(customFixture.componentInstance.boardPieces()[2].name).toBe('Dinner');
  });

  it('should prevent custom pathway addition under subcategories', () => {
    fixture.detectChanges();
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
    const chickenSub = dinnerCat.children![0];

    // Select category & subcategory
    component.toggleCategory(dinnerCat);
    component.toggleSubcategory(chickenSub);
    fixture.detectChanges();

    expect(component.isCustomPanelActive()).toBe(false);
  });

  it('should remove a piece from the board', () => {
    fixture.detectChanges();
    const categories = component.categories();
    const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
    component.toggleCategory(dinnerCat);
    fixture.detectChanges();

    expect(component.boardPieces().length).toBe(3);

    // Remove the Dinner segment (index 2)
    component.removePiece(2);
    fixture.detectChanges();

    expect(component.boardPieces().length).toBe(2);
  });

  describe('Branch Coverage Edge Cases', () => {
    it('should return early from addCustomPiece if name is empty', () => {
      fixture.detectChanges();
      component.customName.set('   ');
      component.customUrl.set('valid-url');
      component.addCustomPiece();
      expect(component.boardPiecesList()[0].length).toBe(2); // no addition
    });

    it('should return early from addCustomPiece if url is too short', () => {
      fixture.detectChanges();
      component.customName.set('Valid Name');
      component.customUrl.set('ab'); // length < 3
      component.addCustomPiece();
      expect(component.boardPiecesList()[0].length).toBe(2); // no addition
    });

    it('should return early from removePiece if index is less than 2', () => {
      fixture.detectChanges();
      component.removePiece(1); // Recipes
      component.removePiece(0); // Home
      expect(component.boardPiecesList()[0].length).toBe(2);
    });

    it('should correctly remove a subcategory without removing parent category', () => {
      fixture.detectChanges();
      const categories = component.categories();
      const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
      const chickenSub = dinnerCat.children![0];

      component.toggleCategory(dinnerCat);
      component.toggleSubcategory(chickenSub);
      fixture.detectChanges();

      expect(component.boardPiecesList()[0].length).toBe(4);

      // Remove subcategory (index 3)
      component.removePiece(3);
      fixture.detectChanges();

      expect(component.boardPiecesList()[0].length).toBe(3);
      expect(component.boardPiecesList()[0][2].name).toBe('Dinner'); // parent intact
    });

    it('should update custom url and strip redundant prefixes dynamically', () => {
      fixture.detectChanges();
      const event = { target: { value: '/recipes/something' } } as unknown as Event;
      component.updateCustomUrl(event);
      // currentUrlPrefix is /recipes/
      expect(component.customUrl()).toBe('something');
    });

    it('should not delete trail if only one exists or index is 0', () => {
      fixture.detectChanges();
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;
      component.deleteTrail(0, mockEvent);
      expect(component.boardPiecesList().length).toBe(1);
    });

    it('should handle value effect gracefully if trails is empty array', async () => {
      const value: CategoryTrails = { trails: [[]] };
      const customFixture = TestBed.createComponent(CategoryBoardComponent);
      customFixture.componentRef.setInput('value', value);
      customFixture.detectChanges();
      await new Promise((r) => setTimeout(r, 0));
      expect(customFixture.componentInstance.boardPiecesList().length).toBe(1);
    });

    it('should correctly select a subcategory when none exists and replace another if present', () => {
      fixture.detectChanges();
      const categories = component.categories();
      const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
      const chickenSub = dinnerCat.children![0];
      const otherSub = { name: 'Beef', url: '/recipes/dinner/beef' };

      component.toggleCategory(dinnerCat);
      component.toggleSubcategory(chickenSub);
      fixture.detectChanges();

      // Toggle a different subcategory (simulated)
      component.toggleSubcategory(otherSub);
      fixture.detectChanges();

      const pieces = component.boardPiecesList()[0];
      expect(pieces[pieces.length - 1].name).toBe('Beef');
    });

    it('should handle currentUrlPrefix and isCustomPanelActive empty states', () => {
      fixture.detectChanges();
      // Force empty lists
      component.boardPiecesList.set([[]]);
      expect(component.currentUrlPrefix()).toBe('/');
      expect(component.isCustomPanelActive()).toBe(false);

      // Force only recipe piece
      component.boardPiecesList.set([[{ name: 'Recipe', url: '/recipe/slug' }]]);
      expect(component.currentUrlPrefix()).toBe('/');
      expect(component.isCustomPanelActive()).toBe(false);
    });

    it('should handle updateCustomUrl when prefix matches exactly but lacks trailing slash', () => {
      fixture.detectChanges();
      const categories = component.categories();
      const dinnerCat = categories.find((c) => c.name === 'Dinner')!;
      component.toggleCategory(dinnerCat);
      fixture.detectChanges();

      const event = { target: { value: '/recipes/dinner' } } as unknown as Event;
      component.updateCustomUrl(event);
      expect(component.customUrl()).toBe('');
    });
    it('should add a new trail when addNewTrail is called', () => {
      const initialTrailsLength = component.boardPiecesList().length;
      component.addNewTrail();
      expect(component.boardPiecesList().length).toBe(initialTrailsLength + 1);
      expect(component.activeTrailIndex()).toBe(initialTrailsLength); // Should switch to new trail
    });

    it('should delete a trail and adjust active trail index', () => {
      // Add a couple trails
      component.addNewTrail();
      component.addNewTrail();
      const len = component.boardPiecesList().length;

      // Switch to the last one
      component.switchTrail(len - 1);

      // Delete a previous one
      component.deleteTrail(1, new Event('click'));

      expect(component.boardPiecesList().length).toBe(len - 1);
      // Active index should shift down
      expect(component.activeTrailIndex()).toBe(len - 2);
    });
  });
});
