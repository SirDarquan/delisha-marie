import { mount } from 'cypress/angular-zoneless';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}
