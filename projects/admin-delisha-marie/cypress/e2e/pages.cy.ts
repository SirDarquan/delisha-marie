describe('Admin Blog Pages & Posts Management', () => {
  const mockPages = [
    {
      id: '1',
      slug: 'home:about',
      title: 'Home About Us',
      content: '<p>Welcome to our home page.</p>',
      updated_at: '2026-10-20T12:00:00Z',
    },
    {
      id: '2',
      slug: 'home:contact',
      title: 'Home Contact Us',
      content: '<p>Contact our family team.</p>',
      updated_at: '2026-10-21T12:00:00Z',
    },
    {
      id: '3',
      slug: 'kitchen:recipes',
      title: 'Kitchen Recipes Hub',
      content:
        '<p>Kitchen favorites</p><div class="story-component-block" data-component-block="true" data-block-height="380" data-block-align="left" data-block-label="My Favorite Things!"></div>',
      updated_at: '2026-10-22T12:00:00Z',
    },
    {
      id: '4',
      slug: 'thank-you',
      title: 'Thank You for Subscribing',
      content: '<p>Thank you for subscribing to our updates.</p>',
      updated_at: '2026-10-19T12:00:00Z',
    },
    {
      id: '5',
      slug: 'about',
      title: 'Legacy About Delisha Marie',
      content: '<p>Legacy about page.</p>',
      updated_at: '2026-10-18T12:00:00Z',
    },
  ];

  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        user: {
          username: 'admin',
          email: 'admin@delishamarie.com',
        },
      },
    }).as('getCurrentUser');

    // Mock pages list
    cy.intercept('GET', '**/api/pages', {
      statusCode: 200,
      body: mockPages,
    }).as('getPages');

    // Mock single page load
    cy.intercept('GET', '**/api/pages/*', (req) => {
      const parts = req.url.split('/');
      const slug = parts[parts.length - 1];
      const match = mockPages.find((p) => p.slug === slug);
      req.reply({
        statusCode: 200,
        body: match || {
          id: '99',
          slug,
          title: 'Custom Page',
          content: '<p>Page content</p>',
          updated_at: '2026-10-23T12:00:00Z',
        },
      });
    }).as('getPage');

    // Mock save page
    cy.intercept('PUT', '**/api/pages/*', {
      statusCode: 200,
      body: { success: true },
    }).as('savePage');

    cy.visit('/pages');
    cy.wait('@getPages');
  });

  it('should render post switcher tabs and filter pages properly', () => {
    cy.get('h1').should('contain.text', 'Blog Pages & Posts');

    // Default active post is Home
    cy.contains('button', 'home').should('exist');
    cy.contains('button', 'kitchen').should('exist');

    // Home should show only home: slugs
    cy.contains('/home:about').should('be.visible');
    cy.contains('/home:contact').should('be.visible');
    cy.contains('/kitchen:recipes').should('not.exist');
    cy.contains('/thank-you').should('not.exist');

    // Switch to Kitchen tab
    cy.contains('button', 'kitchen').click();

    // Kitchen should show kitchen:recipes and legacy unprefixed slugs (thank-you, about)
    cy.contains('/kitchen:recipes').should('be.visible');
    cy.contains('/thank-you').should('be.visible');
    cy.contains('/about').should('be.visible');
    cy.contains('/home:about').should('not.exist');
  });

  it('should open Add Post dialog and create a new post section', () => {
    cy.contains('button', 'New Post').click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('input#postName').type('garden');
    cy.contains('button', 'Create Post').click();

    // Should now have garden tab selected
    cy.contains('button', 'garden').should('be.visible');
    cy.contains('No pages in garden').should('be.visible');
  });

  it('should open Add Page dialog and navigate to new page editor', () => {
    cy.contains('button', 'Add Page').click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('input#pageTitle').type('New Garden Tips');
    cy.get('input#pageSlug').should('have.value', 'new-garden-tips');
    cy.contains('button', 'Create & Edit').click();

    // Should navigate to editor
    cy.url().should('include', '/pages/home:new-garden-tips');
  });

  it('should allow inserting and configuring component block via right-click in editor', () => {
    // Visit page editor
    cy.visit('/pages/kitchen:recipes');
    cy.wait('@getPage');

    // Verify Story HTML Editor loaded
    cy.get('app-story-html-editor .story').should('be.visible');

    // Check existing block
    cy.get('app-story-html-editor [data-component-block="true"]').should('be.visible');

    // Right-click on block to open context menu
    cy.get('app-story-html-editor [data-component-block="true"]').rightclick();

    // Context menu should appear
    cy.contains('Block Settings').should('be.visible');

    // Change layout to Float Right
    cy.contains('button', 'Float Right').click();
    cy.get('app-story-html-editor [data-component-block="true"]')
      .should('have.attr', 'data-block-align', 'right');

    // Change height slider
    cy.get('#blockHeightSlider')
      .invoke('val', 500)
      .trigger('input');

    cy.get('app-story-html-editor [data-component-block="true"]')
      .should('have.attr', 'data-block-height', '500');

    // Close context menu and save page
    cy.contains('button', 'Save Content').scrollIntoView().click({ force: true });
    cy.wait('@savePage');
    cy.contains('Page saved successfully!').should('be.visible');
  });
});
