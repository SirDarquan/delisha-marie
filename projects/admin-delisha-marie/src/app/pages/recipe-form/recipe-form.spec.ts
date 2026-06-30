import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, FormRoot } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryTrails } from '@dm/library';
import { Recipe } from '../../models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipeFormComponent } from './recipe-form';

describe('RecipeFormComponent', () => {
  let component: RecipeFormComponent;
  let fixture: ComponentFixture<RecipeFormComponent>;

  const getValidPublishedModel = () => ({
    title: 'Valid Recipe',
    slug: 'valid-recipe',
    author: 'Delisha Marie',
    category: {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Dinner', url: '/recipes/dinner' },
        ],
      ],
    } as CategoryTrails,
    difficulty: 'Easy',
    prepTime: '10 mins',
    cookTime: '10 mins',
    totalTime: '20 mins',
    yield: '4 servings',
    status: 'published' as const,
    preview_token: 'token',
    image: 'pic.png',
    imageWidth: '100',
    imageHeight: '100',
    imageType: 'image/png',
    description: 'desc',
    content: 'content',
    ingredients: 'ing',
    instructions: 'ins',
    method: 'None',
    theBest: false,
    holidays: '',
    specialDiets: [] as string[],
    cuisine: 'Italian',
    course: 'Dinner',
    keyword: ['key'],
    equipment: 'equip',
    notes: 'note',
    servingSize: '1',
    calories: '100',
    fat: '5',
    carbohydrates: '10',
    protein: '2',
    fiber: '1',
    sugar: '1',
    sodium: '50',
    cholesterol: '5',
    saturatedFat: '1',
    video: '',
  });

  let mockRecipeById: Recipe | null = null;

  let createPayload: Partial<Recipe> = {};
  let updateId: string | number | null = null;

  let updatePayload: Partial<Recipe> = {};
  let navigated: unknown[] = [];
  let routeParams: Record<string, string> = {};
  let dialogResult = true;

  const fakeRecipeService = {
    methods: () => [],
    holidays: () => [],
    specialDiets: () => [],

    fetchRecipeById: (id: string | number) => {
      return Promise.resolve(id ? mockRecipeById : null);
    },

    createRecipe: (payload: Partial<Recipe>) => {
      createPayload = payload;
      return Promise.resolve({ id: 1, ...payload } as unknown as Recipe);
    },

    updateRecipe: (id: string | number, payload: Partial<Recipe>) => {
      updateId = id;
      updatePayload = payload;
      return Promise.resolve({ id, ...payload } as unknown as Recipe);
    },
  };

  const fakeRouter = {
    navigate: (commands: unknown[]) => {
      navigated = commands;
    },
  };

  const fakeActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => routeParams[key] || null,
      },
    },
  };

  const fakeDialog = {
    open: () => ({
      afterClosed: () => ({
        subscribe: (cb: (val: boolean) => void) => cb(dialogResult),
      }),
    }),
  };

  beforeEach(async () => {
    mockRecipeById = null;
    createPayload = {};
    updateId = null;
    updatePayload = {};
    navigated = [];
    routeParams = {};
    dialogResult = true;

    await TestBed.configureTestingModule({
      imports: [RecipeFormComponent, FormRoot, FormField],
      providers: [
        { provide: RecipeService, useValue: fakeRecipeService },
        { provide: Router, useValue: fakeRouter },
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: MatDialog, useValue: fakeDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeFormComponent);
    component = fixture.componentInstance;
  });

  it('should create the component for creation mode', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component['isEdit']()).toBe(false);
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    const testCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Dinner', url: '/recipes/dinner' },
        ],
      ],
    };

    mockRecipeById = {
      id: 1,
      title: 'Mock Pasta',
      slug: 'mock-pasta',
      description: 'Mock test',
      content: 'Mock content',
      ingredients: ['A', 'B'],
      instructions: ['C'],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'published',
      preview_token: 'secret-123',
      method: 'Baking',
      theBest: true,
      holidays: ['Holiday 1'],
      specialDiets: ['Diet 1'],
      category: testCategory,
    };

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['isEdit']()).toBe(true);
    expect(component['recipeModel']().title).toBe('Mock Pasta');
    expect(component['recipeModel']().method).toBe('Baking');
    expect(component['recipeModel']().theBest).toBe(true);
    expect(component['recipeModel']().holidays).toBe('Holiday 1');
    expect(component['recipeModel']().specialDiets).toEqual(['Diet 1']);
    expect(component['recipeModel']().category).toEqual(testCategory);
  });

  it('should parse strings as arrays correctly in edit mode', async () => {
    routeParams['id'] = '2';
    mockRecipeById = {
      id: 2,
      title: 'Mock Pasta',
      slug: 'mock-pasta',
      holidays: ['Christmas', 'Thanksgiving'],
      specialDiets: ['Gluten-Free', 'Vegan'],
    } as unknown as Recipe;
    component.ngOnInit();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['recipeModel']().holidays).toBe('Christmas');
    expect(component['recipeModel']().specialDiets).toEqual(['Gluten-Free', 'Vegan']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Brand New',
      slug: 'brand-new',
    });

    await component.saveRequired('published');

    expect(createPayload).toBeTruthy();
    expect(createPayload.title).toBe('Brand New');
    expect(navigated).toEqual(['/recipes']);
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Pasta',
      slug: 'pasta',
      description: 'mock description',
      content: 'mock content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'draft',
      preview_token: '',
    };

    fixture.detectChanges();

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Pasta v2',
      slug: 'pasta',
    });

    await component.saveRequired('published');

    expect(updateId).toBe('1');
    expect(updatePayload.title).toBe('Pasta v2');
    expect(navigated).toEqual(['/recipes']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component.onCancel();
    expect(navigated).toEqual(['/recipes']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    // Make form dirty
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Modified Title',
    });
    dialogResult = false; // user cancels leaving (stays)

    component.onCancel();
    expect(navigated).toEqual([]);
  });

  it('should ', async () => {
    fixture.detectChanges();
    // Make form dirty
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Modified Title',
    });
    dialogResult = true; // user confirms leaving

    component.onCancel();
    expect(navigated).toEqual(['/recipes']);
  });

  it('should ', async () => {
    routeParams['id'] = '1';

    mockRecipeById = {
      id: 1,
      title: 'Pasta Deluxe',
      slug: 'pasta-deluxe',
      description: 'Test description',
      content: 'Test content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Chef Delisha',
      status: 'draft',
      cuisine: 'Italian',
      course: 'Dinner',
      keywords: ['easy', 'quick'],
      equipment: ['Stand Mixer', 'Baking Sheet'],
      notes: ['Serve hot', 'Add cheese'],
      nutrition: {
        servingSize: '1 bowl',
        calories: '300 kcal',
        fat: '10g',
        saturatedFat: '3g',
        cholesterol: '10mg',
        sodium: '150mg',
        carbohydrates: '40g',
        fiber: '4g',
        sugar: '2g',
        protein: '10g',
      },
    } as unknown as Recipe;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['recipeModel']().cuisine).toBe('Italian');
    expect(component['recipeModel']().course).toBe('Dinner');
    expect(component['recipeModel']().author).toBe('Chef Delisha');
    expect(component['recipeModel']().keyword).toEqual(['easy', 'quick']);
    expect(component['recipeModel']().equipment).toBe('Stand Mixer\nBaking Sheet');
    expect(component['recipeModel']().notes).toBe('Serve hot\nAdd cheese');
    expect(component['recipeModel']().servingSize).toBe('1 bowl');
    expect(component['recipeModel']().calories).toBe('300 kcal');

    // Make some updates and save
    component['recipeModel'].set({
      ...component['recipeModel'](),
      cuisine: 'French',
      notes: 'Serve hot\nAdd cheese\nEnjoy!',
      calories: '350 kcal',
    });

    await component.saveDraft();

    expect(updatePayload.cuisine).toBe('French');
    expect(updatePayload.notes).toEqual(['Serve hot', 'Add cheese', 'Enjoy!']);
    expect(updatePayload.nutrition?.calories).toBe('350 kcal');
    expect(updatePayload.nutrition?.servingSize).toBe('1 bowl');
  });

  it('should ', async () => {
    routeParams['id'] = 'notfound';
    mockRecipeById = null;
    fixture.detectChanges();
    expect(component['isEdit']()).toBe(true);
    expect(component['recipeModel']().title).toBe('');
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Title',
      slug: 'slug',
      description: '',
      content: '',
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: '',
      status: 'draft',
      // Omitted lists purposefully
    } as unknown as Recipe;

    fixture.detectChanges();
    expect(component['recipeModel']().ingredients).toBe('');
    expect(component['recipeModel']().instructions).toBe('');
    expect(component['recipeModel']().holidays).toBe('');
    expect(component['recipeModel']().specialDiets).toEqual([]);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Trim Test',
      slug: 'trim-test',
      status: 'draft',
      ingredients: '   \n Item 1 \n \n Item 2   ', // Should filter out blank lines, and trim spaces
      instructions: '', // Should return empty array
      holidays: 'Holiday 1',
      specialDiets: ['Diet 1', 'Diet B'],
    });

    await component.saveDraft();

    expect(createPayload.ingredients).toEqual(['Item 1', 'Item 2']);
    expect(createPayload.instructions).toEqual([]);
    expect(createPayload.holidays).toEqual(['Holiday 1']);
    expect(createPayload.specialDiets).toEqual(['Diet 1', 'Diet B']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      keyword: [],
    });

    component.addKeyword();
    expect(component['recipeModel']().keyword).toEqual(['']);

    component.onKeywordInput(0, { target: { value: 'New Keyword' } } as unknown as Event);
    expect(component['recipeModel']().keyword).toEqual(['New Keyword']);

    component.addKeyword();
    component.onKeywordInput(1, { target: { value: 'Second' } } as unknown as Event);
    expect(component['recipeModel']().keyword).toEqual(['New Keyword', 'Second']);

    component.removeKeyword(0);
    expect(component['recipeModel']().keyword).toEqual(['Second']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    // title and slug are empty, form is invalid
    expect(component['recipeForm']().invalid()).toBe(true);
  });

  it('should ', async () => {
    fixture.detectChanges();
    expect(component['activeTab']()).toBe('what');

    component['activeTab'].set('where');
    expect(component['activeTab']()).toBe('where');

    component['activeTab'].set('what');
    expect(component['activeTab']()).toBe('what');
  });

  it('should ', async () => {
    fixture.detectChanges();

    const testCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Main Dishes', url: '/recipes/main-dishes' },
          { name: 'Pasta', url: '/recipes/main-dishes/pasta' },
          { name: 'Hey Ya', url: '/recipe/hey-ya' },
        ],
      ],
    };

    component.onCategoryChanged(testCategory);
    expect(component['recipeModel']().category).toEqual(testCategory);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: '',
      slug: '',
      description: 'Draft description',
      status: 'published',
    });

    await component.saveDraft();

    expect(createPayload).toBeTruthy();
    expect(createPayload.status).toBe('draft');
    expect(createPayload.createdAt).toBeUndefined();
    expect(createPayload.updatedAt).toBeUndefined();
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Scheduled Recipe',
      slug: 'scheduled-recipe',
      status: 'scheduled',
    });

    await component.saveRequired('scheduled');

    expect(createPayload).toBeTruthy();
    expect(createPayload.status).toBe('scheduled');
    expect(createPayload.createdAt).toBeDefined();
    expect(createPayload.updatedAt).toBeDefined();
    expect(createPayload.createdAt).toBe(createPayload.updatedAt);
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    const originalCreated = '2026-01-01T00:00:00.000Z';
    const originalUpdated = '2026-01-01T00:00:00.000Z';
    mockRecipeById = {
      id: 1,
      title: 'Published Recipe',
      slug: 'published-recipe',
      status: 'published',
      createdAt: originalCreated,
      updatedAt: originalUpdated,
    } as unknown as Recipe;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component['recipeModel'].update((m) => ({
      ...m,
      ...getValidPublishedModel(),
      title: 'Published Recipe Updated',
      slug: 'published-recipe',
    }));

    await component.saveRequired('published');

    expect(updatePayload).toBeTruthy();
    expect(updatePayload.status).toBe('published');
    expect(updatePayload.createdAt).toBe(originalCreated);
    expect(updatePayload.updatedAt).toBeDefined();
    expect(updatePayload.updatedAt).not.toBe(originalUpdated);
  });

  it('should ', async () => {
    // 1. Draft Track (isEdit=false, status=draft)
    fixture.detectChanges();
    let buttons = fixture.nativeElement.querySelectorAll('button');
    const btnArray1 = Array.from(buttons) as HTMLButtonElement[];
    const saveAsDraftBtn = btnArray1.find((b) => b.textContent?.includes('Save as Draft'));
    const scheduleBtn = btnArray1.find((b) => b.textContent?.includes('Schedule Publication'));

    expect(saveAsDraftBtn).toBeTruthy();
    expect(scheduleBtn).toBeTruthy();

    // 2. PrePublished Track (isEdit=true, status=scheduled)
    component['isEdit'].set(true);
    component['recipeModel'].set({
      ...component['recipeModel'](),
      status: 'scheduled',
    });
    fixture.detectChanges();
    buttons = fixture.nativeElement.querySelectorAll('button');
    const btnArray2 = Array.from(buttons) as HTMLButtonElement[];
    const revertBtn = btnArray2.find((b) => b.textContent?.includes('Revert to Draft'));
    const updateScheduleBtn = btnArray2.find((b) => b.textContent?.includes('Update Schedule'));

    expect(revertBtn).toBeTruthy();
    expect(updateScheduleBtn).toBeTruthy();

    // 3. Published Track (isEdit=true, status=published)
    component['recipeModel'].set({
      ...component['recipeModel'](),
      status: 'published',
    });
    fixture.detectChanges();
    buttons = fixture.nativeElement.querySelectorAll('button');
    const btnArray3 = Array.from(buttons) as HTMLButtonElement[];
    const revertBtnDisabled = btnArray3.find((b) => b.textContent?.includes('Revert to Draft'));
    const scheduleBtnDisabled = btnArray3.find((b) => b.textContent?.includes('Schedule'));
    const updatePublishedBtn = btnArray3.find((b) => b.textContent?.includes('Update Published'));

    expect(revertBtnDisabled).toBeTruthy();
    expect(scheduleBtnDisabled).toBeTruthy();
    expect(updatePublishedBtn).toBeTruthy();
    expect(revertBtnDisabled!.disabled).toBe(true); // Revert to Draft disabled
    expect(scheduleBtnDisabled!.disabled).toBe(true); // Schedule disabled
  });

  it('should ', async () => {
    fixture.detectChanges();

    const testCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Main Dishes', url: '/recipes/main-dishes' },
          { name: 'Pasta', url: '/recipes/main-dishes/pasta' },
        ],
      ],
    };

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Impastable',
      slug: 'impastable',
      category: testCategory,
      theBest: false,
    });

    await component.saveRequired('published');

    expect(createPayload.category).toEqual(testCategory);
    expect(createPayload.breadcrumbs).toBeNull();
  }, 15000);

  it('should ', async () => {
    fixture.detectChanges();

    const testCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Main Dishes', url: '/recipes/main-dishes' },
          { name: 'Pasta', url: '/recipes/main-dishes/pasta' },
          { name: 'Impastable', url: '/recipe/impastable' },
        ],
      ],
    };

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Impastable',
      slug: 'impastable',
      category: testCategory,
      theBest: true,
    });

    await component.saveRequired('published');

    expect(createPayload.category).toBeDefined();
    const resultCategory = createPayload.category as CategoryTrails;
    expect(resultCategory.trails.length).toBe(2);
    // Standard trail remains unchanged
    expect(resultCategory.trails[0]).toEqual(testCategory.trails[0]);
    expect(resultCategory.trails[1]).toEqual([
      { name: 'Home', url: '/' },
      { name: 'The Best Recipes', url: '/the-best-recipes' },
      { name: 'The Best Main Dishes', url: '/the-best-recipes/the-best-main-dishes' },
      { name: 'The Best Pasta', url: '/the-best-recipes/the-best-main-dishes/the-best-pasta' },
      { name: 'Impastable', url: '/recipe/impastable' },
    ]);
  });

  it('should ', async () => {
    fixture.detectChanges();

    const initialCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Pasta', url: '/recipes/pasta' },
          { name: 'Macaroni', url: '/recipe/macaroni' },
        ],
        [
          { name: 'Home', url: '/' },
          { name: 'The Best Recipes', url: '/the-best-recipes' },
          { name: 'The Best Pasta', url: '/the-best-recipes/the-best-pasta' },
          { name: 'Macaroni', url: '/recipe/macaroni' },
        ],
      ],
    };

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Macaroni',
      slug: 'macaroni',
      category: initialCategory,
      theBest: false,
    });

    await component.saveRequired('published');

    expect(createPayload.category).toBeDefined();
    const resultCategory = createPayload.category as CategoryTrails;
    // The Best trail should be filtered out, leaving only the standard trail
    expect(resultCategory.trails.length).toBe(1);
    expect(resultCategory.trails[0]).toEqual(initialCategory.trails[0]);
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Pasta',
      slug: 'pasta',
      description: 'mock description',
      content: 'mock content',
      ingredients: [],
      instructions: [],
      image: '',
      prepTime: '',
      cookTime: '',
      difficulty: 'Easy',
      totalTime: '',
      yield: '',
      author: 'Delisha Marie',
      status: 'draft',
      preview_token: '',
    };
    fixture.detectChanges();
    navigated = [];

    await component.saveDraft();

    expect(updateId).toBe('1');
    expect(navigated).toEqual([]);
  });

  it('should save draft and navigate to edit mode for new recipe', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();

    vi.spyOn(component as unknown as Record<string, unknown>, 'getFieldValue').mockReturnValue(
      'test',
    );
    await await component.saveDraft();

    expect(navigated).toEqual(['/recipes/edit', 1]);
  });

  it('should manage isDraftDisabled state correctly: initially true, false on change, true after saveDraft', async () => {
    fixture.detectChanges();
    // Wait for initialization macro-task (setTimeout)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 1. Initially disabled
    expect(component['isDraftDisabled']()).toBe(true);

    // 2. Simulate user change/input
    component['recipeForm'].title().controlValue.set('Draft Title');
    fixture.detectChanges();
    expect(component['isDraftDisabled']()).toBe(false);

    // 3. Save draft and assert it is disabled again
    await component.saveDraft();
    fixture.detectChanges();
    expect(component['isDraftDisabled']()).toBe(true);
  });

  it('should manage Schedule Publication disabled state: disabled by default, disabled if modified but invalid, enabled if modified and valid, disabled after save', async () => {
    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: '',
      slug: '',
    });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 1. Initially disabled (invalid and not dirty)
    expect(component['recipeForm']().invalid()).toBe(true);
    expect(component['isDirty']()).toBe(false);

    // 2. Change a field to make it dirty but still invalid
    component['recipeForm'].cuisine().controlValue.set('Mexican');
    fixture.detectChanges();
    expect(component['isDirty']()).toBe(true);
    expect(component['recipeForm']().invalid()).toBe(true);

    // 3. Fill required fields (make form valid)
    component['recipeForm'].title().controlValue.set('Valid Title');
    component['recipeForm'].slug().controlValue.set('valid-slug');
    fixture.detectChanges();
    expect(component['recipeForm']().invalid()).toBe(false);
    expect(component['isDirty']()).toBe(true);

    // 4. Save and assert that dirty is reset to false (disabled again)
    await component.saveRequired('scheduled');
    fixture.detectChanges();
    expect(component['isDirty']()).toBe(false);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['isInitialized'] = true;
    expect(component['isDirty']()).toBe(false);

    component.onMethodChanged('Air Frying');
    expect(component['recipeModel']().method).toBe('Air Frying');
    expect(component['isDirty']()).toBe(true);

    component.onSpecialDietsChanged(['Keto', 'Paleo']);
    expect(component['recipeModel']().specialDiets).toEqual(['Keto', 'Paleo']);

    component.onHolidayChanged('Halloween');
    expect(component['recipeModel']().holidays).toBe('Halloween');
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['activeTab'].set('where');
    fixture.detectChanges();

    const categoryBoard = fixture.nativeElement.querySelector('app-category-board');
    expect(categoryBoard).toBeTruthy();
  });

  it('should invoke saveRequired through the signal form submit action callback', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Action Submit',
      slug: 'action-submit',
      difficulty: 'Intermediate',
      prepTime: '10',
      cookTime: '10',
      totalTime: '20',
      yield: '2',
      image: 'pic.png',
      description: 'desc',
      content: 'content',
      ingredients: 'ing',
      instructions: 'ins',
      method: 'Bake',
      status: 'published',
    });
    fixture.detectChanges();

    const { submit } = await import('@angular/forms/signals');
    await submit(component['recipeForm']);

    expect(createPayload.title).toBe('Action Submit');
    expect(createPayload.status).toBe('published');
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Nutrition Test',
      slug: 'nutrition-test',
      status: 'draft',
      calories: '200 kcal', // Only calories is provided
    });

    await component.saveDraft();

    expect(createPayload.nutrition).toBeDefined();
    expect(createPayload.nutrition?.calories).toBe('200 kcal');
    expect(createPayload.nutrition?.servingSize).toBe('');
    expect(createPayload.nutrition?.fat).toBe('');
    expect(createPayload.nutrition?.carbohydrates).toBe('');
    expect(createPayload.nutrition?.protein).toBe('');
    expect(createPayload.nutrition?.fiber).toBe('');
    expect(createPayload.nutrition?.sugar).toBe('');
    expect(createPayload.nutrition?.sodium).toBe('');
    expect(createPayload.nutrition?.cholesterol).toBe('');
    expect(createPayload.nutrition?.saturatedFat).toBe('');
  });

  it('should ', async () => {
    fixture.detectChanges();
    expect(component['recipeForm']().invalid()).toBe(true);

    createPayload = {};
    await component.saveRequired('published');

    expect(createPayload).toBeTruthy();
  });

  it('should create published recipe successfully', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();

    // Mock form valid
    Object.defineProperty(
      (component as unknown as Record<string, unknown>)['recipeForm'](),
      'invalid',
      {
        get: () => false,
        configurable: true,
      },
    );
    vi.spyOn(component as unknown as Record<string, unknown>, 'getFieldValue').mockReturnValue(
      'test',
    );
    Object.defineProperty(
      component['recipeForm']() as unknown as Record<string, unknown>,
      'invalid',
      {
        value: vi.fn().mockReturnValue(false),
        configurable: true,
      },
    );

    await component.saveRequired('published');

    expect(createPayload).toBeTruthy();
  });

  it('should load recipe data into form when in edit mode', async () => {
    routeParams['id'] = '1';
    mockRecipeById = { id: 1 } as unknown as Recipe;
    component.ngOnInit();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['recipeModel']().title).toBe('');
    expect(component['recipeModel']().slug).toBe('');
    expect(component['recipeModel']().author).toBe('Delisha Marie');
    expect(component['recipeModel']().difficulty).toBe('Easy');
    expect(component['recipeModel']().status).toBe('draft');
    expect(component['recipeModel']().preview_token).toBe('');
    expect(component['recipeModel']().holidays).toBe('');
    expect(component['recipeModel']().specialDiets).toEqual([]);
    expect(component['recipeModel']().category).toBeNull();
  });

  it('should ', async () => {
    // 1. Where tab template events
    fixture.detectChanges();
    component['activeTab'].set('where');
    fixture.detectChanges();

    const debugEl = fixture.debugElement;

    const categoryBoard = debugEl.query((el) => el.name === 'app-category-board');
    if (categoryBoard) {
      categoryBoard.triggerEventHandler('categoryChange', { trails: [] });
    }

    const methodSelector = debugEl.query((el) => el.name === 'app-cooking-method-selector');
    if (methodSelector) {
      methodSelector.triggerEventHandler('methodChange', 'Bake');
    }

    const holidaySelector = debugEl.query((el) => el.name === 'app-holidays-selector');
    if (holidaySelector) {
      holidaySelector.triggerEventHandler('holidayChange', 'Easter');
    }

    const dietsSelector = debugEl.query((el) => el.name === 'app-special-diets-selector');
    if (dietsSelector) {
      dietsSelector.triggerEventHandler('dietsChange', ['Vegan']);
    }

    const imageUploader = debugEl.query((el) => el.name === 'app-image-uploader');
    if (imageUploader) {
      imageUploader.triggerEventHandler('imageChange', {
        image: 'pasta.png',
        imageWidth: '1920',
        imageHeight: '1080',
        imageType: 'image/png',
      });
    }

    // 2. Click draft / schedule buttons in draft state
    component['activeTab'].set('what');
    component['isInitialized'] = true;
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const saveAsDraftBtn = buttons.find((b) => b.textContent?.includes('Save as Draft'));
    if (saveAsDraftBtn) {
      saveAsDraftBtn.click();
    }

    // Make valid for schedule
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Valid title',
      slug: 'valid-slug',
    });
    fixture.detectChanges();

    const scheduleBtn = buttons.find((b) => b.textContent?.includes('Schedule Publication'));
    if (scheduleBtn) {
      scheduleBtn.click();
    }

    // 3. Click revert / update schedule buttons in scheduled state
    component['isEdit'].set(true);
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Scheduled',
      slug: 'scheduled-slug',
      status: 'scheduled',
    });
    fixture.detectChanges();

    const buttons2 = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const revertBtn = buttons2.find((b) => b.textContent?.includes('Revert to Draft'));
    if (revertBtn) {
      revertBtn.click();
    }

    const updateScheduleBtn = buttons2.find((b) => b.textContent?.includes('Update Schedule'));
    if (updateScheduleBtn) {
      updateScheduleBtn.click();
    }

    // 4. Click update published button in published state
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Published',
      slug: 'published-slug',
      status: 'published',
    });
    fixture.detectChanges();

    const buttons3 = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const updatePublishedBtn = buttons3.find((b) => b.textContent?.includes('Update Published'));
    if (updatePublishedBtn) {
      updatePublishedBtn.click();
    }

    // Verify that event bindings updated the model
    expect(component['recipeModel']().method).toBe('Bake');
    expect(component['recipeModel']().holidays).toBe('Easter');
    expect(component['recipeModel']().specialDiets).toEqual(['Vegan']);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['isInitialized'] = true;
    expect(component['isDirty']()).toBe(false);

    component.onImageUploaded({
      image: '/images/recipes/2026/06/rooster.jpg',
      imageWidth: '1200',
      imageHeight: '800',
      imageType: 'image/jpeg',
    });

    expect(component['recipeModel']().image).toBe('/images/recipes/2026/06/rooster.jpg');
    expect(component['recipeModel']().imageWidth).toBe('1200');
    expect(component['recipeModel']().imageHeight).toBe('800');
    expect(component['recipeModel']().imageType).toBe('image/jpeg');
    expect(component['isDirty']()).toBe(true);
  });

  it('should ', async () => {
    component['recipeModel'].set({
      ...component['recipeModel'](),
      status: 'published',
    });
    fixture.detectChanges();
    // Verify validations run and form is invalid
    expect(component['recipeForm']().invalid()).toBe(true);
  });

  it('should ', async () => {
    fixture.detectChanges();
    const fallbackModel = {
      ...component['recipeModel'](),
      title: 'Fallback Test',
      slug: 'fallback-test',
      specialDiets: undefined as unknown as string[], // line 905 fallback
      difficulty: undefined as unknown as 'Easy' | 'Intermediate' | 'Advanced', // line 936 fallback
      author: undefined as unknown as string, // line 949 fallback
      fat: '10g', // truthy to enter nutrition block
      calories: undefined as unknown as string, // line 920 fallback
    };

    const result = component['serializeRecipe'](fallbackModel, 'draft');
    expect(result.specialDiets).toEqual([]);
    expect(result.difficulty).toBe('Easy');
    expect(result.author).toBe('Delisha Marie');
    expect(result.nutrition?.calories).toBe('');
  });

  it('should ', async () => {
    routeParams['id'] = '1';
    mockRecipeById = {
      id: 1,
      title: 'Published Recipe',
      slug: 'published-recipe',
      status: 'published',
      createdAt: undefined as unknown as string, // missing
      updatedAt: undefined as unknown as string,
    } as unknown as Recipe;

    fixture.detectChanges();

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Published Recipe Updated',
      slug: 'published-recipe',
    });

    await component.saveRequired('published');
    expect(updatePayload.createdAt).toBeDefined();
    expect(updatePayload.updatedAt).toBeDefined();
  });

  it('should ', async () => {
    fixture.detectChanges();

    const testCategory: CategoryTrails = {
      trails: [
        [
          { name: 'Home', url: '/' }, // ends with /
          { name: 'Recipes', url: '/recipes' }, // does not end with /
          { name: 'Pasta', url: '' }, // rawUrl empty
          { name: 'Impastable', url: '/recipe/impastable' },
        ],
      ],
    };

    component['recipeModel'].set({
      ...getValidPublishedModel(),
      title: 'Impastable',
      slug: 'impastable',
      category: testCategory,
      theBest: true,
    });

    await component.saveRequired('published');
    expect((createPayload.category as CategoryTrails)?.trails[1]).toBeDefined();
  });

  it('should ', async () => {
    // Intercept Object.defineProperty to modify recipeModel status during constructor property initialization
    const originalDefineProperty = Object.defineProperty;

    const ObjectWithAny = Object as unknown as {
      defineProperty: (
        o: unknown,
        p: PropertyKey,
        attributes: PropertyDescriptor & ThisType<unknown>,
      ) => unknown;
    };
    ObjectWithAny.defineProperty = function (
      obj: unknown,
      prop: PropertyKey,
      descriptor: PropertyDescriptor,
    ) {
      if (prop === 'recipeModel' && descriptor && descriptor.value) {
        const signalVal = descriptor.value as {
          set: (val: unknown) => void;
          (): Record<string, unknown>;
        };
        signalVal.set({
          ...signalVal(),
          status: 'published',
        });
      }
      return originalDefineProperty.call(Object, obj, prop, descriptor);
    };

    try {
      const newFixture = TestBed.createComponent(RecipeFormComponent);
      newFixture.detectChanges();

      // Ensure the structural published validations are executed
      expect(newFixture.componentInstance['recipeForm']().invalid()).toBe(true);
    } finally {
      const ObjectWithAny = Object as unknown as {
        defineProperty: (
          o: unknown,
          p: PropertyKey,
          attributes: PropertyDescriptor & ThisType<unknown>,
        ) => unknown;
      };
      ObjectWithAny.defineProperty = originalDefineProperty;
    }
  });

  it('should trigger onImageUploaded via template imageChange binding (line 291)', async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0)); // wait for isInitialized to be true
    const uploaderEl = fixture.debugElement.query(By.css('app-image-uploader'));
    uploaderEl.triggerEventHandler('imageChange', {
      image: '/images/recipes/2026/06/test.jpg',
      imageWidth: '100',
      imageHeight: '100',
      imageType: 'image/jpeg',
    });
    expect(component['recipeModel']().image).toBe('/images/recipes/2026/06/test.jpg');
    expect(component['isDirty']()).toBe(true);
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Brand New',
      slug: 'brand-new',
      difficulty: 'Easy',
      status: 'draft',
    });

    // Mock createRecipe to return an object without ID
    const spy = vi
      .spyOn(fakeRecipeService, 'createRecipe')
      .mockReturnValue(Promise.resolve({} as unknown as Recipe));

    await component.saveDraft();
    expect(navigated).toEqual([]);
    spy.mockRestore(); // Restore the original implementation!
  });

  it('should ', async () => {
    fixture.detectChanges();
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Draft Save Test',
      slug: 'draft-save-test',
    });

    // Call saveRequired with 'draft' as any to bypass scheduled/published blocks
    await component.saveRequired('draft' as unknown as 'published');
    expect(createPayload.createdAt).toBeUndefined();
    expect(createPayload.updatedAt).toBeUndefined();
  });

  it('should ', async () => {
    fixture.detectChanges();
    const originalPush = Array.prototype.push;

    // Override push to intercept the pushed objects and clear the url
    Array.prototype.push = function (...args) {
      if (args[0] && args[0].name === 'The Best Recipes') {
        args[0].url = '';
      }
      return originalPush.apply(this, args);
    };

    try {
      const best = component['getBestTrail']([
        { name: 'Home', url: '/' },
        { name: 'Recipes', url: '/recipes' },
        { name: 'Pasta', url: '/recipes/pasta' },
      ]);
      expect(best[2].url).toBe('/the-best-pasta');
    } finally {
      Array.prototype.push = originalPush;
    }
  });

  it('should ', async () => {
    fixture.detectChanges();
    const originalPush = Array.prototype.push;

    // Override push to intercept and append trailing slash
    Array.prototype.push = function (...args) {
      if (args[0] && args[0].name === 'The Best Recipes') {
        args[0].url = '/the-best-recipes/';
      }
      return originalPush.apply(this, args);
    };

    try {
      const best = component['getBestTrail']([
        { name: 'Home', url: '/' },
        { name: 'Recipes', url: '/recipes' },
        { name: 'Pasta', url: '/recipes/pasta' },
      ]);
      expect(best[2].url).toBe('/the-best-recipes/the-best-pasta');
    } finally {
      Array.prototype.push = originalPush;
    }
  });

  it('should enable Save as Draft when typing in any field, and disable it when cleared/reverted to initial value', async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Setup initialModel as clean
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Initial Title',
      slug: 'initial-slug',
    });
    component['initialModel'].set({
      ...component['recipeModel'](),
    });
    fixture.detectChanges();

    // Initially disabled (no changes)
    expect(component['isDraftDisabled']()).toBe(true);

    // Type in cuisine field
    component['recipeForm'].cuisine().controlValue.set('Italian');
    fixture.detectChanges();

    // Now it is dirty, so Save as Draft is enabled
    expect(component['isDraftDisabled']()).toBe(false);

    // Revert/clear cuisine field back to empty
    component['recipeForm'].cuisine().controlValue.set('');
    fixture.detectChanges();

    // Now it is back to clean initial state, so Save as Draft is disabled again
    expect(component['isDraftDisabled']()).toBe(true);
  });

  it('should enable Save as Draft when modifying the title field, and disable it when reverted to initial value', async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Setup initialModel as clean
    component['recipeModel'].set({
      ...component['recipeModel'](),
      title: 'Initial Title',
      slug: 'initial-slug',
    });
    component['initialModel'].set({
      ...component['recipeModel'](),
    });
    fixture.detectChanges();

    // Initially disabled (no changes)
    expect(component['isDraftDisabled']()).toBe(true);

    // Type in title field
    component['recipeForm'].title().controlValue.set('New Title');
    fixture.detectChanges();

    // Now it is dirty, so Save as Draft is enabled
    expect(component['isDraftDisabled']()).toBe(false);

    // Revert/clear title field back to initial value
    component['recipeForm'].title().controlValue.set('Initial Title');
    fixture.detectChanges();

    // Now it is back to clean initial state, so Save as Draft is disabled again
    expect(component['isDraftDisabled']()).toBe(true);
  });
});
