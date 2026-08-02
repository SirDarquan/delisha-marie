import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20000,
    setupFiles: ['projects/admin-delisha-marie/src/api/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/admin-delisha-marie-api',
    },
  },
});
