// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
// import './commands';

beforeEach(() => {
  cy.intercept('GET', '/config', {
    statusCode: 200,
    body: {
      supabaseUrl: 'http://localhost:54321',
      supabaseAnonKey: 'mock-key',
      imagekitUrlEndpoint: 'https://ik.imagekit.io/mock',
    },
  }).as('getConfig');
});
beforeEach(() => {
  cy.intercept('GET', '**/config', {
    statusCode: 200,
    body: {
      SocialClients: {},
      DescopeProjectId: 'mock-descope-project-id',
    },
  }).as('getAppConfig');

  cy.intercept('GET', '/api/categories', {
    statusCode: 200,
    body: [],
  }).as('getCategories');

  cy.intercept('GET', '/api/methods', {
    statusCode: 200,
    body: [],
  }).as('getMethods');

  cy.intercept('GET', '/api/holidays', {
    statusCode: 200,
    body: [],
  }).as('getHolidays');

  cy.intercept('GET', '/api/special-diets', {
    statusCode: 200,
    body: [],
  }).as('getSpecialDiets');
});
