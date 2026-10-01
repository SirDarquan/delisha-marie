describe('Main Blog Global Navigation', () => {
  beforeEach(() => {
    // Intercept any active Supabase request on startup if needed
    cy.intercept('GET', '**/rest/v1/recipes*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyRecipes');

    cy.intercept('GET', '**/api/pages/about', {
      statusCode: 200,
      body: { id: '1', slug: 'about', title: 'About' },
    }).as('getAboutPage');

    cy.intercept('GET', '**/api/pages/contact', {
      statusCode: 200,
      body: { id: '2', slug: 'contact', title: 'Contact' },
    }).as('getContactPage');

    cy.intercept('GET', '**/api/pages/non-existent-route-goes-here', {
      statusCode: 404,
      body: { error: 'Not found' },
    }).as('getMissingPage');

    cy.visit('/');
  });

  it('should render the Homepage with dm-header, dm-footer, and primary brand element', () => {
    // Check core layout elements
    cy.get('dm-header').should('be.visible');
    cy.get('.logo-container').should('be.visible');
    cy.get('dm-footer').should('exist');

    // Title is branded using dynamic TitleStrategy on router stabilization
    cy.title().should('eq', "Home | Delisha Marie's Kitchen");
  });

  // Updated by Cypress Author on 2026-09-24 for multi-zone navigation
  it('should link to the About page from the header navigation menu', () => {
    cy.get('dm-header').within(() => {
      cy.contains('a', 'About').should('have.attr', 'href').and('include', '/about');
    });
  });

  it('should navigate to the Recipes Index and confirm rendering', () => {
    // In header, the link routerLink="/recipe-index" contains text "Recipes"
    cy.get('dm-header').within(() => {
      cy.get('a').contains('Recipes').click({ force: true });
    });
    cy.url().should('include', '/recipe-index');
    cy.title().should('eq', "Recipe Index | Delisha Marie's Kitchen");
  });

  // Updated by Cypress Author on 2026-09-24 for multi-zone navigation
  it('should link to the Contact page from the header navigation menu', () => {
    cy.get('dm-header').within(() => {
      cy.contains('a', 'Contact').should('have.attr', 'href').and('include', '/contact');
    });
  });

  // Updated by Cypress Author on 2026-10-01 for wildcard redirect to home
  it('should successfully fallback to Home page if an unknown URL is specified', () => {
    // Router redirects '**' back to ''
    cy.visit('/non-existent-route-goes-here');
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
    cy.title().should('eq', "Home | Delisha Marie's Kitchen");
  });
});
