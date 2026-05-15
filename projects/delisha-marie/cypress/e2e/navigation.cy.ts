describe('Main Blog Global Navigation', () => {
  beforeEach(() => {
    // Intercept any active Supabase request on startup if needed
    cy.intercept('GET', '**/rest/v1/recipes*', {
      statusCode: 200,
      body: [],
    }).as('getEmptyRecipes');

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

  it('should navigate to the About page from the header navigation menu', () => {
    // Click inside desktop menu link
    cy.get('dm-header').within(() => {
      cy.get('a').contains('About').click({ force: true });
    });
    cy.url().should('include', '/about');
    cy.title().should('eq', "About | Delisha Marie's Kitchen");
  });

  it('should navigate to the Recipes Index and confirm rendering', () => {
    // In header, the link routerLink="/recipe-index" contains text "Recipes"
    cy.get('dm-header').within(() => {
      cy.get('a').contains('Recipes').click({ force: true });
    });
    cy.url().should('include', '/recipe-index');
    cy.title().should('eq', "Recipe Index | Delisha Marie's Kitchen");
  });

  it('should navigate to the Contact page and display the contact details', () => {
    cy.get('dm-header').within(() => {
      cy.get('a').contains('Contact').click({ force: true });
    });
    cy.url().should('include', '/contact');
    cy.title().should('eq', "Contact | Delisha Marie's Kitchen");
  });

  it('should successfully fallback to Home page if an unknown URL is specified', () => {
    // Router redirects '**' back to ''
    cy.visit('/non-existent-route-goes-here');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
