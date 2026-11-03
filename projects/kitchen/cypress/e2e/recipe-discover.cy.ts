describe('Recipe Discovery Listings', () => {
  // Build an array of 13 recipes to guarantee pagination (12 per page config)
  const generateMockRecipes = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Recipe Variation ${i + 1}`,
      slug: `recipe-variation-${i + 1}`,
      description: `Delectable test description for element ${i + 1}`,
      image: 'test-dish.jpg',
      category: 'Dinner',
      prepTime: '10m',
      cookTime: '20m',
      rating: 5,
      nutrition: {
        calories: '200 kcal',
        servingSize: '1 plate',
      },
      navigation: { prev: null, next: null },
      breadcrumbs: { items: [] },
    }));
  };

  beforeEach(() => {
    // Mock collection index structures (served by Api service pointing to /api/recipe-index)
    cy.intercept('GET', '/api/recipe-index*', {
      statusCode: 200,
      body: {
        categoriesList: [
          {
            name: 'Dinner',
            url: '/recipes/dinner',
            children: [{ name: 'Chicken', url: '/recipes/dinner/chicken' }],
          },
        ],
        methodsList: [],
        holidays: [],
        specialDiets: [],
        theBest: [],
        ingredients: [],
      },
    }).as('getIndex');
  });

  it('should load list view grid and render recipe cards with proper imagery', () => {
    cy.intercept('GET', '/api/recipes*', {
      statusCode: 200,
      body: { items: generateMockRecipes(5), total: 5 },
    }).as('getRecipes');

    cy.visit('/recipes');
    cy.wait('@getRecipes');

    // Check header display title
    cy.get('h1').should('contain.text', 'Recipes');

    // Check dynamic breadcrumbs
    cy.get('dml-breadcrumbs').should('contain.text', 'Home').and('contain.text', 'Recipes');

    // Check recipe cards
    cy.get('mat-card').should('have.length', 5);
    cy.get('mat-card-content h3').first().should('contain.text', 'Recipe Variation 1');
  });

  it('should display empty state icon/message when no recipes are yielded', () => {
    cy.intercept('GET', '/api/recipes*', {
      statusCode: 200,
      body: { items: [], total: 0 },
    }).as('getEmptyRecipes');

    cy.visit('/recipes');
    cy.wait('@getEmptyRecipes');

    cy.get('.col-span-full').should('contain.text', 'No recipes found for this selection.');
    cy.get('mat-icon').contains('restaurant_menu').should('be.visible');
  });

  it('should handle pagination controls correctly when items exceed standard limit', () => {
    cy.intercept('GET', '/api/recipes*', {
      statusCode: 200,
      body: { items: generateMockRecipes(15), total: 15 }, // 15 items, first page will show 12
    }).as('getPaginatedRecipes');

    cy.visit('/recipes');
    cy.wait('@getPaginatedRecipes');

    // Assert active items on first page
    cy.get('mat-card').should('have.length', 12);

    // Handle ngx-pagination elements
    cy.get('pagination-controls').should('exist');
    cy.get('.ngx-pagination a').contains('2').click();

    // Validate routing update
    cy.url().should('include', '/page/2');
  });

  it('should display refine category filters and navigate to subcategory path', () => {
    cy.intercept('GET', '/api/recipes*', {
      statusCode: 200,
      body: { items: generateMockRecipes(2), total: 2 },
    }).as('getFilteredRecipes');

    cy.visit('/recipes/dinner');

    // Check dynamic title matches category name
    cy.get('h1').should('contain.text', 'Dinner');

    // Should render subcategories menu "Chicken"
    cy.get('dml-refine-by').should('contain.text', 'Chicken');
  });
});
