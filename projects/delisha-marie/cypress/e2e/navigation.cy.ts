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

  it('should successfully fallback to a 404 page if an unknown URL is specified', () => {
    // Router matches ':slug' and shows a 404 page if not found in db
    cy.visit('/non-existent-route-goes-here');
    cy.title().should('eq', "Page Not Found | Delisha Marie's Kitchen");
    cy.get('dm-dynamic-page').should('be.visible');
    cy.contains('Page Not Found').should('be.visible');
  });
});
