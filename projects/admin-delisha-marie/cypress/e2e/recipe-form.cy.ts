describe('Admin Recipe Form Flow', () => {
  const mockRecipe = {
    id: 99,
    title: 'Garlic Rosemary Chicken',
    slug: 'garlic-rosemary-chicken',
    category: {
      trails: [
        [
          { name: 'Home', url: '/' },
          { name: 'Recipes', url: '/recipes' },
          { name: 'Dinner', url: '/recipes/dinner' },
        ],
      ],
    },
    prepTime: '10m',
    cookTime: '30m',
    totalTime: '40m',
    yield: '4 servings',
    difficulty: 'Easy',
    description: 'Flavorful garlic and rosemary skillet chicken.',
    content: 'Delicious pan seared chicken.',
    ingredients: ['1 lb Chicken breast', '3 cloves garlic', '2 sprigs rosemary'],
    instructions: ['Season chicken', 'Pan-sear on high', 'Simmer with herbs'],
    image: 'chicken.jpg',
    imageWidth: '800',
    imageHeight: '600',
    imageType: 'image/jpeg',
    author: 'Delisha Marie',
    cuisine: 'American',
    course: 'Main Course',
    keywords: ['chicken', 'garlic', 'rosemary'],
    equipment: ['skillet'],
    notes: ['good with potatoes'],
    nutrition: {
      servingSize: '1 breast',
      calories: '250',
      fat: '10g',
      carbohydrates: '5g',
      protein: '35g',
      fiber: '1g',
      sugar: '0g',
      sodium: '200mg',
      cholesterol: '85mg',
      saturatedFat: '2g',
    },
    method: 'Baking',
    status: 'published',
    breadcrumbs: {
      main: 0,
      items: [
        [
          { label: 'Home', url: '/' },
          { label: 'Recipes', url: '/recipes' },
          { label: 'Dinner', url: '/recipes/dinner' },
          { label: 'Garlic Rosemary Chicken' },
        ],
      ],
    },
  };

  beforeEach(() => {
    // Ensure the page considers us authenticated immediately on load
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        user: {
          username: 'admin',
          email: 'admin@delishamarie.com',
        },
      },
    }).as('getCurrentUser');

    cy.intercept('GET', '**/api/recipes/holidays*', {
      statusCode: 200,
      body: [],
    }).as('getHolidays');

    cy.intercept('GET', '**/api/recipes/special-diets*', {
      statusCode: 200,
      body: [],
    }).as('getDiets');
  });

  it('should handle NEW Recipe creation form flow via dialog', () => {
    // Seed empty array into localStorage BEFORE navigation so RecipeService reads it synchronously
    // This completely bypasses the async GET recipes.json API call
    cy.visit('/recipes', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('admin_recipes', JSON.stringify([]));
      },
    });

    cy.intercept('GET', '**/api/check-slug*', {
      statusCode: 200,
      body: { taken: false }, // slug available
    }).as('checkSlug');

    cy.intercept('POST', '**/api/recipes', {
      statusCode: 201,
      body: { ...mockRecipe, id: 100 },
    }).as('createRecipe');

    cy.intercept('GET', '**/api/recipes/100', {
      statusCode: 200,
      body: { ...mockRecipe, id: 100 },
    }).as('getNewRecipe');

    // Open the creation dialog
    cy.contains('button', 'New Recipe').click();

    // Dialog should be visible
    cy.get('mat-dialog-container').should('be.visible');

    // Fill in the dialog
    cy.get('mat-dialog-container #title')
      .should('not.be.disabled')
      .type(mockRecipe.title, { force: true });
    cy.get('mat-dialog-container #title').blur();

    cy.get('mat-dialog-container #slug')
      .should('not.be.disabled')
      .type(mockRecipe.slug, { force: true });
    cy.get('mat-dialog-container #slug').blur();

    // Wait for slug async validation to complete
    cy.wait('@checkSlug');

    // Submit the dialog once it is enabled
    cy.get('mat-dialog-container button[type="submit"]').should('not.be.disabled').click();
    cy.wait('@createRecipe');

    // Should redirect to edit page
    cy.location('pathname', { timeout: 10000 }).should('eq', '/recipes/edit/100');
    cy.wait('@getNewRecipe');

    cy.get('h1').should('contain.text', 'Edit Recipe');

    // The title and slug should already be populated from the draft creation
    cy.get('#title').should('have.value', mockRecipe.title);
    cy.get('#slug').should('have.value', mockRecipe.slug);

    cy.get('#prepTime').should('not.be.disabled').type(mockRecipe.prepTime, { force: true });
    cy.get('#prepTime').blur();

    cy.get('#cookTime').should('not.be.disabled').type(mockRecipe.cookTime, { force: true });
    cy.get('#cookTime').blur();

    cy.get('#totalTime').should('not.be.disabled').type(mockRecipe.totalTime, { force: true });
    cy.get('#totalTime').blur();

    cy.get('#yield').should('not.be.disabled').type(mockRecipe.yield, { force: true });
    cy.get('#yield').blur();

    cy.get('#author').should('not.be.disabled').type(mockRecipe.author, { force: true });
    cy.get('#author').blur();

    cy.get('#cuisine').should('not.be.disabled').type(mockRecipe.cuisine, { force: true });
    cy.get('#cuisine').blur();

    cy.get('#course').should('not.be.disabled').type(mockRecipe.course, { force: true });
    cy.get('#course').blur();

    mockRecipe.keywords.forEach((keyword, index) => {
      cy.contains('button', 'Add Keyword').click();
      cy.get(`#keyword-${index}`).type(keyword, { force: true });
    });

    // Use window.ng to programmatically set the required image, method, and breadcrumb metadata fields to avoid CORS/upload issues in headless E2E
    cy.window().then((win: unknown) => {
      const w = win as {
        ng?: {
          getComponent: (el: Element) => {
            recipeForm: Record<string, () => { value: { set: (val: unknown) => void } }>;
          };
        };
        document: Document;
      };
      const el = w.document.querySelector('app-recipe-form');
      if (el && w.ng) {
        const comp = w.ng.getComponent(el);
        comp.recipeForm['image']().value.set(mockRecipe.image);
        comp.recipeForm['imageWidth']().value.set(mockRecipe.imageWidth);
        comp.recipeForm['imageHeight']().value.set(mockRecipe.imageHeight);
        comp.recipeForm['imageType']().value.set(mockRecipe.imageType);
        comp.recipeForm['method']().value.set(mockRecipe.method);
        comp.recipeForm['category']().value.set({
          trails: [
            [
              { name: 'Home', url: '/' },
              { name: 'Recipes', url: '/recipes' },
              { name: 'Dinner', url: '/recipes/dinner' },
            ],
          ],
        });
      }
    });

    cy.get('#description').should('not.be.disabled').type(mockRecipe.description, { force: true });
    cy.get('#description').blur();

    cy.get('#content').should('not.be.disabled').type(mockRecipe.content, { force: true });
    cy.get('#content').blur();

    cy.get('#ingredients')
      .should('not.be.disabled')
      .type(mockRecipe.ingredients.join('\n'), { force: true });
    cy.get('#ingredients').blur();

    cy.get('#instructions')
      .should('not.be.disabled')
      .type(mockRecipe.instructions.join('\n'), { force: true });
    cy.get('#instructions').blur();

    cy.get('#equipment')
      .should('not.be.disabled')
      .type(mockRecipe.equipment.join('\n'), { force: true });
    cy.get('#equipment').blur();

    cy.get('#notes').should('not.be.disabled').type(mockRecipe.notes.join('\n'), { force: true });
    cy.get('#notes').blur();

    // Nutritional Info
    cy.get('#servingSize')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.servingSize, { force: true });
    cy.get('#servingSize').blur();

    cy.get('#calories')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.calories, { force: true });
    cy.get('#calories').blur();

    cy.get('#fat').should('not.be.disabled').type(mockRecipe.nutrition.fat, { force: true });
    cy.get('#fat').blur();

    cy.get('#saturatedFat')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.saturatedFat, { force: true });
    cy.get('#saturatedFat').blur();

    cy.get('#cholesterol')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.cholesterol, { force: true });
    cy.get('#cholesterol').blur();

    cy.get('#sodium').should('not.be.disabled').type(mockRecipe.nutrition.sodium, { force: true });
    cy.get('#sodium').blur();

    cy.get('#carbohydrates')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.carbohydrates, { force: true });
    cy.get('#carbohydrates').blur();

    cy.get('#fiber').should('not.be.disabled').type(mockRecipe.nutrition.fiber, { force: true });
    cy.get('#fiber').blur();

    cy.get('#sugar').should('not.be.disabled').type(mockRecipe.nutrition.sugar, { force: true });
    cy.get('#sugar').blur();

    cy.get('#protein')
      .should('not.be.disabled')
      .type(mockRecipe.nutrition.protein, { force: true });
    cy.get('#protein').blur();

    // Interaction with Mat-Select components on the first tab
    cy.get('#difficulty').click();
    cy.get('mat-option').contains('Easy').click();

    // Switch to Where is it tab to interact with categories and cooking methods
    cy.contains('button', 'Where is it').click();

    cy.intercept('PUT', '**/api/recipes/100', {
      statusCode: 200,
      body: mockRecipe,
    }).as('updateRecipeSubmit');

    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@updateRecipeSubmit');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/recipes');
  });

  it('should preload data and handle EDIT Recipe update flow', () => {
    cy.intercept('GET', '**/api/recipes/99', {
      statusCode: 200,
      body: mockRecipe,
    }).as('getRecipe');

    cy.intercept('PUT', '**/api/recipes/*', {
      statusCode: 200,
      body: { ...mockRecipe, title: 'Updated Chicken Title' },
    }).as('updateRecipe');

    cy.visit('/recipes/edit/99', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('admin_recipes', JSON.stringify([mockRecipe]));
        // Prevent location.back() from hanging the test runner on Linux when history is empty
        // Replace current state with /recipes, then push the edit URL so Angular router boots correctly
        win.history.replaceState({}, '', '/recipes');
        win.history.pushState({}, '', '/recipes/edit/99');
      },
    });

    cy.wait('@getRecipe');
    cy.get('h1').should('contain.text', 'Edit Recipe');

    // Form values should now be preloaded instantly!
    cy.get('#title').should('have.value', mockRecipe.title);

    cy.get('#title').clear({ force: true }).type('Updated Chicken Title', { force: true });
    cy.get('#title').blur();

    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@updateRecipe').its('request.body.title').should('eq', 'Updated Chicken Title');

    // Note: We don't check cy.location('pathname') here because the app uses location.back(),
    // which does nothing when the page is loaded directly via cy.visit() as the first history entry.
  });
});
