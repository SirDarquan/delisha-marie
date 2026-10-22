describe('Search Page', () => {
  it('should display search input and handle searching', () => {
    cy.visit('/?q=pasta');

    // Check page title
    cy.get('h1').should('contain', 'Recipe Search');

    // Type in search query
    cy.get('input[placeholder*="craving"]').clear().type('chicken');

    // Click search button
    cy.get('form').first().find('button[type="submit"]').click();

    // Verify url changed
    cy.url().should('include', '?q=chicken');

    // Ensure loading skeletons or actual results are shown
    // We just verify the main layout doesn't break
    cy.get('main').should('be.visible');
  });

  it('should load initial search from url params', () => {
    cy.visit('/?q=beef');

    // Input should be populated with beef
    cy.get('input[placeholder*="craving"]').should('have.value', 'beef');

    // Results area or loading should be visible
    cy.get('dm-search').should('be.visible');
  });

  // Added by Cypress Author on 2026-10-22 for standardized 350px sidebar layout
  it('should render the sidebar at 350px width on desktop viewport', () => {
    cy.viewport(1280, 800);
    cy.visit('/?q=pasta');
    cy.get('dm-search aside').should('be.visible');
    cy.get('dm-search aside dml-sidebar').should('be.visible');
    cy.get('dm-search aside').invoke('width').should('be.closeTo', 350, 1);
  });
});
