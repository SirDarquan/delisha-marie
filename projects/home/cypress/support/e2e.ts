// ***********************************************************
// This support/e2e.ts file is processed and
// loaded automatically before your test files.
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
import './commands';

beforeEach(() => {
  cy.intercept('GET', '**/api/pages/home:about*', {
    statusCode: 200,
    body: {
      id: 'mock-about-id',
      slug: 'home:about',
      title: 'About Delisha Marie',
      description: 'The story behind the recipes and culinary passion.',
      content:
        '<p>Welcome to Delisha Marie! Explore recipes and <a href="{{kitchenUrl}}">Visit the Kitchen</a>.</p>',
      updated_at: new Date().toISOString(),
    },
  }).as('getAboutPage');
});
