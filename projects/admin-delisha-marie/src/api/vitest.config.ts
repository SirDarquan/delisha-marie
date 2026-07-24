import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20000,
    coverage: {
      reportsDirectory: 'coverage/admin-delisha-marie-api',
    },
  },
});
