import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['test/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/delisha-marie-api',
    },
  },
});
