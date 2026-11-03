import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4211',
    specPattern: 'projects/kitchen/cypress/e2e/**/*.cy.ts',
    supportFile: 'projects/kitchen/cypress/support/e2e.ts',
  },
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
  },
});
