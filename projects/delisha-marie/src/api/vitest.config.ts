import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['projects/delisha-marie/src/api/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/delisha-marie-api',
    },
  },
});
