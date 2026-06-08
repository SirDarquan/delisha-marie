import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4205',
    specPattern: 'projects/admin-delisha-marie/cypress/e2e/**/*.cy.ts',
    supportFile: 'projects/admin-delisha-marie/cypress/support/e2e.ts',
  },
  allowCypressEnv: false,
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
  },
});
