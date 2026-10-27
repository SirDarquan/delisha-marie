import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    silent: true,
    onConsoleLog() {
      return false;
    },
    testTimeout: 20000,
    setupFiles: ['test/vitest.setup.ts'],
    coverage: {
      reportsDirectory: 'coverage/admin-delisha-marie-api',
    },
  },
});
