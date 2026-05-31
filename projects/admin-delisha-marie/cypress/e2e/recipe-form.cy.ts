describe('Admin Recipe Form Flow', () => {
  const mockRecipe = {
    id: 99,
    title: 'Garlic Rosemary Chicken',
    slug: 'garlic-rosemary-chicken',
    category: 'Dinner',
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
    author: 'Delisha Marie',
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
  });

  it('should handle NEW Recipe creation form flow', () => {
    // Seed empty array into localStorage BEFORE navigation so RecipeService reads it synchronously
    // This completely bypasses the async GET recipes.json API call
    cy.visit('/recipes/create', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('admin_recipes', JSON.stringify([]));
      },
    });

    cy.intercept('POST', '**/api/recipes*', {
      statusCode: 201,
      body: mockRecipe,
    }).as('createRecipe');

    cy.get('h1').should('contain.text', 'New Recipe');

    // Ensure the form control signals are fully initialized and bound before typing
    cy.get('#title').should('not.be.disabled').type(mockRecipe.title);
    cy.get('#title').blur();

    cy.get('#slug').should('not.be.disabled').type(mockRecipe.slug);
    cy.get('#slug').blur();

    cy.get('#prepTime').should('not.be.disabled').type(mockRecipe.prepTime);
    cy.get('#prepTime').blur();

    cy.get('#cookTime').should('not.be.disabled').type(mockRecipe.cookTime);
    cy.get('#cookTime').blur();

    cy.get('#totalTime').should('not.be.disabled').type(mockRecipe.totalTime);
    cy.get('#totalTime').blur();

    cy.get('#yield').should('not.be.disabled').type(mockRecipe.yield);
    cy.get('#yield').blur();

    cy.get('#description').should('not.be.disabled').type(mockRecipe.description);
    cy.get('#description').blur();

    cy.get('#content').should('not.be.disabled').type(mockRecipe.content);
    cy.get('#content').blur();

    cy.get('#ingredients').should('not.be.disabled').type(mockRecipe.ingredients.join('\n'));
    cy.get('#ingredients').blur();

    cy.get('#instructions').should('not.be.disabled').type(mockRecipe.instructions.join('\n'));
    cy.get('#instructions').blur();

    cy.get('#difficulty').should('not.be.disabled').select('Easy');

    cy.contains('button', 'Where is it').click();
    cy.get('#category').should('not.be.disabled').select('Dinner');

    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@createRecipe');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/recipes');
  });

  it('should preload data and handle EDIT Recipe update flow', () => {
    // Seed the specific mock recipe into localStorage BEFORE visit.
    // The service constructor runs immediately and reads it into memory synchronously.
    // This guarantees that by the time ngOnInit executes, the cache contains ID 99!
    cy.visit('/recipes/edit/99', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('admin_recipes', JSON.stringify([mockRecipe]));
      },
    });

    cy.intercept('PUT', '**/api/recipes/*', {
      statusCode: 200,
      body: { ...mockRecipe, title: 'Updated Chicken Title' },
    }).as('updateRecipe');

    cy.get('h1').should('contain.text', 'Edit Recipe');

    // Form values should now be preloaded instantly!
    cy.get('#title').should('have.value', mockRecipe.title);

    cy.get('#title').clear().type('Updated Chicken Title');
    cy.get('#title').blur();

    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@updateRecipe');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/recipes');
  });
});
