import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20000,
    setupFiles: ['test/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/admin-delisha-marie-api',
    },
  },
});
