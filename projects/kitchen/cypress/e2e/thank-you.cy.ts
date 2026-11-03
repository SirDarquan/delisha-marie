describe('Thank You Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', {
      statusCode: 200,
      body: { items: [], total: 0 },
    }).as('anyApi');

    // Intercept to avoid hitting real backend for favorites if any
    cy.intercept('GET', '**/api/recipes/favorites/list', {
      statusCode: 200,
      body: {
        items: [
          {
            title: 'Mock Favorite Recipe',
            slug: 'mock-favorite-recipe',
            image: '/placeholder.jpg',
          },
        ],
      },
    }).as('getFavorites');

    cy.intercept('GET', '**/api/pages/*thank-you*', {
      statusCode: 200,
      body: {
        id: 'thank-you',
        title: 'Thank You',
        slug: 'thank-you',
        content: '<p>Thank You Content</p>',
        updated_at: '2026-08-01',
      },
    }).as('getPage');

    cy.visit('/thank-you');
  });

  it('should display the thank you page correctly', () => {
    cy.get('h1').contains('Thank You'); // Assumes ColoredHeaderComponent has 'Thank You'
    cy.get('.story').should('exist');

    // Check if favorite things component rendered
    cy.get('dm-favorite-things').should('exist');
    cy.wait('@getFavorites');
    cy.get('dm-favorite-things').contains('Mock Favorite Recipe');
  });
});
