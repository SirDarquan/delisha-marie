// ***********************************************************
// This example support/component.ts is processed and
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

import './cypress-mount';
// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/angular-zoneless';

// The Cypress namespace augmentation has been moved to component.d.ts
// to satisfy ESLint's no-namespace rule in ambient contexts naturally.

Cypress.Commands.add('mount', mount);

// Example use:
// cy.mount(MyComponent)
