import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CategoryBoardComponent } from './category-board';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.model';
import { CategoryTrails } from '@dm/library';

describe('CategoryBoardComponent', () => {
  let component: CategoryBoardComponent;
  let fixture: ComponentFixture<CategoryBoardComponent>;

  const mockRecipesSignal = signal<Recipe[]>([
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
  ]);

  const fakeRecipeService = {
    recipes: mockRecipesSignal,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBoardComponent],
      providers: [{ provide: RecipeService, useValue: fakeRecipeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBoardComponent);
    component = fixture.componentInstance;
  });

  it('should create and render base board pieces', () => {
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

  it('should load initial category values through constructor effect', async () => {
    const initialCategory: CategoryTrails = {
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
    customFixture.componentRef.setInput('initialCategory', initialCategory);
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
});
