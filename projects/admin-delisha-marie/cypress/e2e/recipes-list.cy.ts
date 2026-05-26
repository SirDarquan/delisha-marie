describe('Admin Recipes List Page', () => {
  const mockRecipes = [
    {
      id: 1,
      title: 'Creamy Garlic Pasta',
      category: 'Dinner',
      slug: 'creamy-garlic-pasta',
      prepTime: '15 mins',
      cookTime: '20 mins',
      image: 'placeholder.png',
      description: 'Tasty pasta dish',
      difficulty: 'Easy',
    },
    {
      id: 2,
      title: 'Chocolate Cake',
      category: 'Dessert',
      slug: 'chocolate-cake',
      prepTime: '20 mins',
      cookTime: '40 mins',
      image: 'placeholder2.png',
      description: 'Delicious chocolate dessert',
      difficulty: 'Intermediate',
    },
  ];

  beforeEach(() => {
    // Simulate actively logged in admin with correct session response wrap
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        user: {
          username: 'admin',
          email: 'admin@delishamarie.com',
        },
      },
    }).as('getCurrentUser');

    // Note: The app service fetches items from `/recipes.json` on init.
    // Intercept this endpoint to mock our test repository list.
    cy.intercept('GET', '**/api/recipes.json*', {
      statusCode: 200,
      body: mockRecipes,
    }).as('getRecipes');

    cy.visit('/recipes');
    cy.wait('@getRecipes');
  });

  it('should render the page header and the list of recipes in a table', () => {
    cy.get('h1').should('contain.text', 'Recipe Directory');

    // Check table structure
    cy.get('table[aria-label="List of all recipes"]').should('exist');
    cy.get('tbody tr').should('have.length', 2);
    cy.get('tbody tr').eq(0).should('contain.text', 'Creamy Garlic Pasta');
    cy.get('tbody tr').eq(1).should('contain.text', 'Chocolate Cake');
  });

  it('should filter recipes based on query search strings', () => {
    // Filter by "Pasta"
    cy.get('#search').type('Pasta');
    cy.get('#search').blur();

    // Matching should filter client-side reactively
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').should('contain.text', 'Creamy Garlic Pasta');
    cy.get('tbody tr').should('not.contain.text', 'Chocolate Cake');
  });

  it('should show empty state display when query matches nothing', () => {
    cy.get('#search').type('UnknownMysteryDish');
    cy.get('#search').blur();

    cy.get('tbody tr').should('have.length', 1); // The empty <tr> colspan=6
    cy.get('tbody td').should('contain.text', 'No recipes found');
  });

  it('should trigger native delete confirmation', () => {
    // Setup listener for native confirm dialog to click "OK"
    cy.on('window:confirm', () => true);

    // Intercept proxy api DELETE route
    cy.intercept('DELETE', '**/api/recipes/*', {
      statusCode: 200,
      body: { success: true },
    }).as('deleteRequest');

    // Find the first Delete button and trigger click
    cy.get('tbody tr').first().contains('Delete').click({ force: true });

    cy.wait('@deleteRequest');
  });

  it('should allow the administrator to log out safely', () => {
    // Intercept local api signout route
    cy.intercept('POST', '**/api/auth/signout*', {
      statusCode: 200,
      body: { success: true },
    }).as('postLogout');

    // Intercept subsequent session check to return Unauthorized after signout triggers
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 401,
      body: { error: 'Unauthorized' },
    }).as('getUserLoggedOut');

    // Click Log Out button
    cy.get('button').contains('Log Out').click({ force: true });
    cy.wait('@postLogout');

    // Cypress redirects to /login after logout
    cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
  });
});
