import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BreadcrumbBoardComponent } from './breadcrumb-board';
import { Breadcrumbs } from '@dm/library';
import { RecipeService } from '../../services/recipe.service';

const mockRecipeService = {
  recipes: signal<any[]>([
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
            { label: 'Dips', url: '/recipes/appetizers/dips' }
          ]
        ]
      }
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
            { label: 'Eggs', url: '/recipes/breakfast/eggs' }
          ]
        ]
      }
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
            { label: 'Beef', url: '/recipes/main-dishes/beef' }
          ]
        ]
      }
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
            { label: 'Chicken', url: '/recipes/main-dishes/chicken' }
          ]
        ]
      }
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
            { label: 'Pasta', url: '/recipes/main-dishes/pasta' }
          ]
        ]
      }
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
            { label: 'Pork', url: '/recipes/main-dishes/pork' }
          ]
        ]
      }
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
            { label: 'Seafood', url: '/recipes/main-dishes/seafood' }
          ]
        ]
      }
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
            { label: 'Sides', url: '/recipes/sides' }
          ]
        ]
      }
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
            { label: 'Salads', url: '/recipes/salads' }
          ]
        ]
      }
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
            { label: 'Soups', url: '/recipes/soups' }
          ]
        ]
      }
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
            { label: 'Breads', url: '/recipes/breads' }
          ]
        ]
      }
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
            { label: 'Desserts', url: '/recipes/desserts' }
          ]
        ]
      }
    }
  ])
};

describe('BreadcrumbBoardComponent', () => {
  let component: BreadcrumbBoardComponent;
  let fixture: ComponentFixture<BreadcrumbBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbBoardComponent],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService }
      ]
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
    const event = { target: { value: '/recipes/summer-cookout/' } } as any;
    component.updateCustomUrl(event);
    expect(component.customUrl()).toBe('summer-cookout/'); // Redundant prefix and leading slashes removed

    // Verify salads variations always sanitize correctly
    const eventSalads1 = { target: { value: 'recipes/salads' } } as any;
    component.updateCustomUrl(eventSalads1);
    expect(component.customUrl()).toBe('salads');

    const eventSalads2 = { target: { value: '/recipes/salads' } } as any;
    component.updateCustomUrl(eventSalads2);
    expect(component.customUrl()).toBe('salads');

    const eventSalads3 = { target: { value: 'salads' } } as any;
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
    expect(component.boardPieces().some(p => p.name === 'Pasta')).toBe(false);
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
    expect(component.boardPieces().some(p => p.name === 'Pasta')).toBe(false);
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
    expect(component.boardPieces().some(p => p.name === 'Main Dishes')).toBe(false);
    expect(component.boardPieces().some(p => p.name === 'Pasta')).toBe(false);
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
});
